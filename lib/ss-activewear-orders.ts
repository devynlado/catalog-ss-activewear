import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SS_BASE_URL = 'https://api.ssactivewear.com/v2';

// Rate limiter: SS allows 60 requests/minute
let requestTimestamps: number[] = [];
const RATE_LIMIT = 55; // leave buffer
const RATE_WINDOW_MS = 60_000;

function getServiceSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function getSSAuthHeader(): string {
  const username = process.env.SS_USERNAME;
  const apiKey = process.env.SS_API_KEY;
  if (!username || !apiKey) throw new Error('SS_USERNAME and SS_API_KEY are required');
  return `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(ts => now - ts < RATE_WINDOW_MS);
  if (requestTimestamps.length >= RATE_LIMIT) {
    const oldest = requestTimestamps[0];
    const waitMs = RATE_WINDOW_MS - (now - oldest) + 100;
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  requestTimestamps.push(Date.now());
}

async function ssOrderRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } = {}
): Promise<T> {
  await waitForRateLimit();

  const { method = 'GET', body, timeoutMs = 30_000 } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: getSSAuthHeader(),
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    cache: 'no-store',
  };

  if (body) fetchOptions.body = JSON.stringify(body);

  try {
    const response = await fetch(`${SS_BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    const rateLimitRemaining = response.headers.get('X-Rate-Limit-Remaining');
    if (rateLimitRemaining) {
      console.log(`[SS Orders] Rate limit remaining: ${rateLimitRemaining}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SS API ${response.status}: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`SS API timeout after ${timeoutMs}ms for ${endpoint}`);
    }
    throw error;
  }
}

/** S&S "Identifier SKU (Brand, Style, Color, Size) - Out Of Stock …" line from POST /orders/ errors[].message */
const SS_OOS_LINE =
  /Identifier\s+(\S+)\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*-\s*Out Of Stock/i;

interface ParsedOosLine {
  brand: string;
  style: string;
  color: string;
  size: string;
}

function parseSsOosMessages(messages: string[]): ParsedOosLine[] {
  const out: ParsedOosLine[] = [];
  for (const msg of messages) {
    const m = msg.match(SS_OOS_LINE);
    if (!m) continue;
    out.push({
      brand: m[2].trim(),
      style: m[3].trim(),
      color: m[4].trim(),
      size: m[5].trim(),
    });
  }
  return out;
}

function joinSizeList(sizes: string[]): string {
  const u = [...new Set(sizes.map((s) => s.trim()).filter(Boolean))];
  u.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (u.length === 0) return '';
  if (u.length === 1) return u[0];
  if (u.length === 2) return `${u[0]} and ${u[1]}`;
  return `${u.slice(0, -1).join(', ')}, and ${u[u.length - 1]}`;
}

/**
 * Staff-facing copy for the order row + SS Activewear admin card.
 * Full raw API text stays in ss_activity_log.details.error only.
 */
function formatStaffOosSummary(lines: ParsedOosLine[]): string {
  if (lines.length === 0) return '';

  const byVariant = new Map<string, { brand: string; style: string; color: string; sizes: string[] }>();
  for (const l of lines) {
    const key = `${l.brand}\0${l.style}\0${l.color}`;
    if (!byVariant.has(key)) {
      byVariant.set(key, { brand: l.brand, style: l.style, color: l.color, sizes: [] });
    }
    byVariant.get(key)!.sizes.push(l.size);
  }

  const sentences: string[] = [];
  for (const { brand, style, color, sizes } of byVariant.values()) {
    const uniq = [...new Set(sizes.map((s) => s.trim()).filter(Boolean))];
    const sizePart = joinSizeList(uniq);
    const noun = uniq.length === 1 ? 'is' : 'are';
    sentences.push(`${brand} · ${style} · ${color} / ${sizePart} ${noun} out of stock at S&S.`);
  }

  if (sentences.length === 1) {
    return sentences[0];
  }
  if (sentences.length <= 3) {
    return `${sentences.join('\n')}\nS&S did not place any part of this order (no in-stock lines).`;
  }
  return `${sentences.slice(0, 2).join('\n')}\n… and ${sentences.length - 2} more color/style group(s) with no stock. S&S did not place this order.\nSee SS Activity log for every SKU.`;
}

/**
 * Short summary for admin SS card + orders.ss_auto_order_error.
 * SS Activity log keeps details.error = full raw message unchanged.
 */
function summarizeSsPlaceOrderError(rawMessage: string): string {
  const m = rawMessage.match(/^SS API (\d+):\s*(.*)$/is);
  const body = (m?.[2] || rawMessage).trim();

  try {
    const json = JSON.parse(body) as {
      message?: string;
      errors?: Array<{ field?: string; message?: string }>;
    };
    const errors = json?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const lineMsgs = errors
        .map((e) => e.message)
        .filter((msg): msg is string => Boolean(msg));
      const linesSummary = errors.find((e) => e.field === 'Lines')?.message;
      const oosParsed = parseSsOosMessages(lineMsgs);
      const hasOosPattern =
        oosParsed.length > 0 || lineMsgs.some((msg) => /out of stock/i.test(msg));
      const noLines = /no lines in stock/i.test(linesSummary || '');

      if (hasOosPattern || noLines) {
        if (oosParsed.length > 0) {
          return formatStaffOosSummary(oosParsed);
        }
        if (noLines || lineMsgs.length > 0) {
          return 'S&S had no inventory for anything on this order — every requested SKU/lines came back with no stock (see SS Activity log for raw API details).';
        }
      }

      const short = lineMsgs
        .filter((msg) => msg.length < 220)
        .slice(0, 3);
      if (short.length > 0) {
        const more = lineMsgs.length > short.length ? `\n(+${lineMsgs.length - short.length} more messages in the activity log.)` : '';
        return `S&S rejected the order:\n${short.join('\n')}${more}`;
      }
      const joined = lineMsgs[0]?.slice(0, 280) || json.message || 'Unknown S&S error.';
      const tail = lineMsgs[0] && lineMsgs[0].length > 280 ? '…' : '';
      return `S&S rejected the order: ${joined}${tail}\n(Full response is in SS Activity log.)`;
    }
    if (json?.message) {
      return `S&S: ${json.message}`;
    }
  } catch {
    /* body is not JSON */
  }

  const clipped = rawMessage.length > 420 ? `${rawMessage.slice(0, 420)}…` : rawMessage;
  return `S&S order could not be placed.\n${clipped}\n(See SS Activity log for the full message.)`;
}

// ------------------------------------------------------------------
// SS Activity Log helper
// ------------------------------------------------------------------

interface LogSSActivityParams {
  orderId: string;
  ssOrderId?: string | null;
  activityType: string;
  status: 'success' | 'error' | 'warning' | 'info';
  title: string;
  details?: Record<string, unknown>;
  supabase?: SupabaseClient;
}

export async function logSSActivity(params: LogSSActivityParams): Promise<void> {
  const supabase = params.supabase || getServiceSupabase();
  await supabase.from('ss_activity_log').insert({
    order_id: params.orderId,
    ss_order_id: params.ssOrderId || null,
    activity_type: params.activityType,
    status: params.status,
    title: params.title,
    details: params.details || {},
  });
}

// ------------------------------------------------------------------
// Shipping method mapping: Garment Decor -> SS Activewear codes
// ------------------------------------------------------------------

const SHIPPING_METHOD_MAP: Record<string, string> = {
  economy: '1',       // Ground
  standard: '1',      // Ground
  ground: '1',        // Ground
  express: '3',       // UPS 2nd Day Air
  '2day': '3',        // UPS 2nd Day Air
  overnight: '2',     // UPS Next Day Air
  nextday: '2',       // UPS Next Day Air
  cheapest: '54',     // Misc Cheapest
};

function mapShippingMethod(method: string | null, isExpress?: boolean): string {
  if (!method) return isExpress ? '3' : '1';
  const normalized = method.toLowerCase().replace(/[\s_-]/g, '');
  return SHIPPING_METHOD_MAP[normalized] || '1';
}

// ------------------------------------------------------------------
// PLACEMENT GUARD (atomic mutex + verify-before-resend helpers)
// ------------------------------------------------------------------

type PlacementClaim = 'fresh' | 'reclaim' | 'skip';

// A 'placing' claim older than this is treated as abandoned (e.g. the serverless
// function was killed mid-flight). Re-claiming it always goes through
// verify-before-resend, so a re-claim can never duplicate a committed order.
const PLACEMENT_STALE_MS = 15 * 60 * 1000;

/**
 * Atomically claim the right to place this order with S&S, using a single-row
 * conditional UPDATE as a mutex (safe under concurrent webhooks / cron / admin).
 *
 *  - 'fresh'   : order was never attempted -> safe to POST directly.
 *  - 'reclaim' : a previous attempt failed / is undetermined / went stale ->
 *                caller MUST verify with S&S before re-sending.
 *  - 'skip'    : another attempt is in-flight, or the order is already placed.
 */
async function claimPlacement(
  db: SupabaseClient,
  orderId: string
): Promise<PlacementClaim> {
  const nowIso = new Date().toISOString();

  // Fresh: never attempted. Only one concurrent caller can win this (Postgres
  // re-checks the WHERE against the committed row version under READ COMMITTED).
  const { data: fresh } = await db
    .from('orders')
    .update({ ss_order_placement_state: 'placing', ss_order_placement_at: nowIso })
    .eq('id', orderId)
    .eq('ss_order_placement_state', 'none')
    .select('id');
  if (fresh && fresh.length > 0) return 'fresh';

  // Retryable: a previous definitive failure or undetermined outcome.
  const { data: retry } = await db
    .from('orders')
    .update({ ss_order_placement_state: 'placing', ss_order_placement_at: nowIso })
    .eq('id', orderId)
    .in('ss_order_placement_state', ['failed', 'unknown'])
    .select('id');
  if (retry && retry.length > 0) return 'reclaim';

  // Stale in-flight: a prior 'placing' that never resolved (crash / killed
  // function). Older than PLACEMENT_STALE_MS only.
  const staleCutoff = new Date(Date.now() - PLACEMENT_STALE_MS).toISOString();
  const { data: stale } = await db
    .from('orders')
    .update({ ss_order_placement_state: 'placing', ss_order_placement_at: nowIso })
    .eq('id', orderId)
    .eq('ss_order_placement_state', 'placing')
    .lt('ss_order_placement_at', staleCutoff)
    .select('id');
  if (stale && stale.length > 0) return 'reclaim';

  return 'skip';
}

/** Set the placement state (+ optional extra order columns) in one update. */
async function setPlacementState(
  db: SupabaseClient,
  orderId: string,
  state: 'none' | 'placing' | 'placed' | 'unknown' | 'failed',
  extra?: Record<string, unknown>
): Promise<void> {
  await db
    .from('orders')
    .update({
      ss_order_placement_state: state,
      ss_order_placement_at: new Date().toISOString(),
      ...(extra || {}),
    })
    .eq('id', orderId);
}

/**
 * Look up existing S&S orders by our PO number (= order_number) via
 * `GET /orders/PO,{po}`. Used to verify whether an order already exists at S&S
 * before re-sending, so a lost/timed-out response never produces a duplicate.
 *
 * Throws if the lookup itself fails: the caller MUST treat that as
 * "outcome unknown" and NOT re-send (avoiding a duplicate on S&S downtime).
 */
export async function findSSOrdersByPO(
  poNumber: string
): Promise<SSOrderResponse[]> {
  if (!poNumber) return [];
  const encoded = encodeURIComponent(poNumber);
  const res = await ssOrderRequest<SSOrderResponse[]>(`/orders/PO,${encoded}`);
  const list = Array.isArray(res) ? res : [];
  // Defensive exact-match (the API filter is a comma-list identifier search).
  return list.filter((o) => (o.poNumber || '').trim() === poNumber.trim());
}

/**
 * Reconcile our DB with orders that already exist at S&S (found via PO lookup).
 * Inserts any missing ss_orders rows idempotently (ON CONFLICT on ss_guid) and
 * marks the order as placed. This both prevents duplicate re-sends and heals
 * rows lost when the original POST response never came back.
 */
export async function reconcileSSOrdersFromRemote(
  orderId: string,
  remoteOrders: SSOrderResponse[],
  supabase?: SupabaseClient
): Promise<void> {
  const db = supabase || getServiceSupabase();

  const { data: shipments } = await db
    .from('order_shipments')
    .select('*')
    .eq('order_id', orderId)
    .order('shipment_index', { ascending: true });

  for (const ssOrder of remoteOrders) {
    const matchingShipment = shipments?.find((s) => !s.ss_order_number);

    const { data: inserted } = await db
      .from('ss_orders')
      .upsert(
        {
          order_id: orderId,
          shipment_id: matchingShipment?.id || null,
          ss_order_number: ssOrder.orderNumber,
          ss_invoice_number: ssOrder.invoiceNumber || null,
          ss_guid: ssOrder.guid,
          ss_warehouse: ssOrder.warehouseAbbr,
          ss_order_status: ssOrder.orderStatus,
          ss_delivery_status: ssOrder.deliveryStatus || null,
          ss_expected_delivery_date: ssOrder.expectedDeliveryDate || null,
          ss_tracking_number: ssOrder.trackingNumber || null,
          ss_carrier: ssOrder.shippingCarrier || null,
          ss_subtotal: ssOrder.subtotal,
          ss_shipping: ssOrder.shipping,
          ss_total: ssOrder.total,
          ss_total_weight: ssOrder.totalWeight,
          ss_total_boxes: ssOrder.totalBoxes,
          ss_raw_response: ssOrder as unknown as Record<string, unknown>,
        },
        { onConflict: 'ss_guid', ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();

    if (matchingShipment && inserted) {
      await db
        .from('order_shipments')
        .update({
          ss_order_number: ssOrder.orderNumber,
          ss_invoice_number: ssOrder.invoiceNumber || null,
          ss_guid: ssOrder.guid,
          expected_delivery_date: ssOrder.expectedDeliveryDate || null,
        })
        .eq('id', matchingShipment.id);
    }
  }

  const deliveryDates = remoteOrders
    .map((o) => o.expectedDeliveryDate)
    .filter(Boolean)
    .sort();

  const updateData: Record<string, unknown> = {
    status: 'ordered',
    ordered_at: new Date().toISOString(),
    ss_auto_order_failed: false,
    ss_auto_order_error: null,
    ss_order_placement_state: 'placed',
    ss_order_placement_at: new Date().toISOString(),
  };
  if (deliveryDates.length > 0) {
    updateData.expected_delivery_date = deliveryDates[deliveryDates.length - 1];
  }
  await db.from('orders').update(updateData).eq('id', orderId);

  await db.from('order_activities').insert({
    order_id: orderId,
    activity_type: 'ordered',
    details: {
      ss_order_numbers: remoteOrders.map((o) => o.orderNumber),
      auto_ordered: true,
      reconciled: true,
    },
  });
}

// ------------------------------------------------------------------
// PLACE ORDER with SS Activewear
// ------------------------------------------------------------------

interface SSOrderLine {
  identifier: string;
  qty: number;
}

interface SSPlaceOrderPayload {
  shippingAddress: {
    customer: string;
    attn: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    residential: boolean;
  };
  shippingMethod: string;
  shipBlind: boolean;
  poNumber: string;
  emailConfirmation: string;
  testOrder: boolean;
  autoselectWarehouse: boolean;
  AutoSelectWarehouse_Preference: string;
  AutoSelectWarehouse_Fewest_MaxDIT: number;
  rejectLineErrors: boolean;
  rejectLineErrors_Email: boolean;
  paymentProfile?: { email: string; profileID: number };
  lines: SSOrderLine[];
}

interface SSOrderResponse {
  guid: string;
  companyName: string;
  warehouseAbbr: string;
  orderNumber: string;
  invoiceNumber: string;
  poNumber: string;
  customerNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  shipDate?: string;
  orderType: string;
  terms: string;
  orderStatus: string;
  dropship: boolean;
  shippingCarrier: string;
  shippingMethod: string;
  shipBlind: boolean;
  trackingNumber?: string;
  deliveryStatus?: string;
  shippingAddress: {
    customer: string;
    attn: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  totalWeight: number;
  totalBoxes: number;
  totalPieces: number;
  totalLines: number;
  lines?: Array<{
    lineNumber: number;
    type: string;
    skuID: number;
    sku: string;
    gtin: string;
    qtyOrdered: number;
    price: number;
    brandName: string;
    styleName: string;
    title: string;
    colorName: string;
    sizeName: string;
    returnable: boolean;
  }>;
}

interface SSOrderWithLineErrors {
  Orders?: SSOrderResponse[];
  orders?: SSOrderResponse[];
  LineErrors?: Array<{
    sku: string;
    identifier: string;
    qty: number;
    error: string;
  }>;
  lineErrors?: Array<{
    sku: string;
    identifier: string;
    qty: number;
    error: string;
  }>;
}

export interface PlaceOrderResult {
  success: boolean;
  ssOrders: SSOrderResponse[];
  lineErrors: Array<{ sku: string; identifier: string; qty: number; error: string }>;
  error?: string;
}

export async function placeSSOrder(
  orderId: string,
  supabase?: SupabaseClient
): Promise<PlaceOrderResult> {
  const db = supabase || getServiceSupabase();

  // Fetch order with shipments
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // --- Atomic placement guard (DB-level mutex) ---------------------------
  // Replaces the old non-atomic "read ss_orders then POST" idempotency check.
  // Only one caller can flip the order into 'placing'; everyone else backs off.
  // This closes the concurrent-webhook / admin-vs-cron duplicate race.
  const claim = await claimPlacement(db, orderId);

  if (claim === 'skip') {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'info',
      title: 'SS placement already completed or in progress (idempotency guard)',
      supabase: db,
    });
    return {
      success: true,
      ssOrders: [],
      lineErrors: [],
      error: 'Already placed or in progress',
    };
  }

  // --- Verify-before-resend --------------------------------------------
  // For any re-entry (previous failed / undetermined / stale attempt) the order
  // may already exist at S&S even though our DB has no ss_orders row — e.g. the
  // first POST timed out AFTER S&S committed it. That is the exact bug that made
  // the retry cron duplicate ORD-260813-E0MS / ORD-260816-4564. So ask S&S by PO
  // first; if it already has the order, reconcile and DO NOT re-send.
  if (claim === 'reclaim' && process.env.SS_VERIFY_BEFORE_PLACE !== 'false') {
    let remote: SSOrderResponse[] = [];
    try {
      remote = await findSSOrdersByPO(order.order_number);
    } catch (err) {
      // Verification itself failed (S&S unreachable). We must NOT risk a
      // duplicate — leave the order 'unknown' and let a later run retry.
      const msg = `Could not verify with S&S before re-send: ${
        err instanceof Error ? err.message : 'lookup failed'
      }`;
      await setPlacementState(db, orderId, 'unknown', {
        ss_auto_order_failed: true,
        ss_auto_order_error: msg,
      });
      await logSSActivity({
        orderId,
        activityType: 'order_verify_failed',
        status: 'warning',
        title: 'Skipped re-send — could not verify existing order with S&S',
        details: { po_number: order.order_number, error: msg },
        supabase: db,
      });
      return { success: false, ssOrders: [], lineErrors: [], error: msg };
    }

    if (remote.length > 0) {
      await reconcileSSOrdersFromRemote(orderId, remote, db);
      await logSSActivity({
        orderId,
        activityType: 'auto_order_skipped',
        status: 'info',
        title: `SS order already existed at S&S (verified by PO) — reconciled ${remote.length} order(s), skipped duplicate re-send`,
        details: {
          po_number: order.order_number,
          ss_order_numbers: remote.map((r) => r.orderNumber),
        },
        supabase: db,
      });
      return { success: true, ssOrders: remote, lineErrors: [] };
    }
    // Nothing at S&S — safe to place below.
  }

  // Kill switch (after guard/verify — do not mark failed when an SS order already exists)
  if (process.env.SS_AUTO_ORDER_ENABLED === 'false') {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'warning',
      title: 'Auto-ordering disabled (kill switch)',
      details: { reason: 'SS_AUTO_ORDER_ENABLED is false' },
      supabase: db,
    });
    const killMsg =
      'Automatic S&S ordering is disabled (SS_AUTO_ORDER_ENABLED=false). Turn it on in Vercel env and use Retry, or place the order on ssactivewear.com manually.';
    await setPlacementState(db, orderId, 'failed', {
      ss_auto_order_failed: true,
      ss_auto_order_error: killMsg,
    });
    return { success: false, ssOrders: [], lineErrors: [], error: 'Auto-ordering disabled' };
  }

  // Build order lines — only include items supplied by SS Activewear
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const productItems = items.filter(item => item.type !== 'decoration');

  type CartLine = { sku?: string; styleId?: number; colorCode?: string; sizeName?: string; quantity?: number };
  const cartLines = productItems as CartLine[];

  const skuList = [...new Set(cartLines.map((item) => item.sku).filter(Boolean) as string[])];
  const styleIds = [
    ...new Set(
      cartLines
        .map((item) => item.styleId)
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
    ),
  ];

  type SsSkuRow = { sku: string; style_id: number; color_code: string; size_name: string };
  const ssSkuRows: SsSkuRow[] = [];

  if (skuList.length > 0) {
    const { data: bySku } = await db
      .from('product_skus')
      .select('sku, style_id, color_code, size_name')
      .in('sku', skuList)
      .eq('supplier', 'ss_activewear');
    ssSkuRows.push(...((bySku || []) as SsSkuRow[]));
  }
  if (styleIds.length > 0) {
    const { data: byStyle } = await db
      .from('product_skus')
      .select('sku, style_id, color_code, size_name')
      .in('style_id', styleIds)
      .eq('supplier', 'ss_activewear');
    const seen = new Set(ssSkuRows.map((r) => r.sku));
    for (const row of (byStyle || []) as SsSkuRow[]) {
      if (!seen.has(row.sku)) {
        seen.add(row.sku);
        ssSkuRows.push(row);
      }
    }
  }

  const normPart = (s: string | undefined) => (s || '').trim().toLowerCase();

  function resolveSsMasterSku(item: CartLine): string | null {
    const direct = ssSkuRows.find((r) => r.sku === item.sku);
    if (direct) return direct.sku;
    if (item.styleId == null || item.colorCode == null || item.sizeName == null) return null;
    const cc = normPart(item.colorCode);
    const sn = normPart(item.sizeName);
    const match = ssSkuRows.find(
      (r) =>
        r.style_id === item.styleId &&
        normPart(r.color_code) === cc &&
        normPart(r.size_name) === sn
    );
    return match?.sku ?? null;
  }

  const qtyByIdentifier = new Map<string, number>();
  for (const item of cartLines) {
    const master = resolveSsMasterSku(item);
    if (!master) continue;
    const qty = item.quantity || 1;
    qtyByIdentifier.set(master, (qtyByIdentifier.get(master) || 0) + qty);
  }

  const lines: SSOrderLine[] = [...qtyByIdentifier.entries()].map(([identifier, qty]) => ({
    identifier,
    qty,
  }));

  const skippedItems = cartLines.filter((item) => !resolveSsMasterSku(item));

  if (lines.length === 0) {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'info',
      title: 'No SS Activewear items in this order',
      details: skippedItems.length > 0
        ? { skipped_skus: skippedItems.map((i) => i.sku || '(no sku)'), reason: 'Items belong to other suppliers' }
        : undefined,
      supabase: db,
    });
    // Product lines exist but none map to S&S — admin must fix SKUs/supplier data or place manually; surface Retry in admin UI.
    if (cartLines.length > 0) {
      const msg =
        skippedItems.length > 0
          ? `Could not build S&S order lines: ${skippedItems.length} cart line(s) did not match an S&S SKU (check cart SKUs vs product_skus, color/size spelling, or supplier).`
          : 'Cart has product lines but none map to S&S Activewear.';
      await setPlacementState(db, orderId, 'failed', {
        ss_auto_order_failed: true,
        ss_auto_order_error: msg,
      });
      return { success: false, ssOrders: [], lineErrors: [], error: msg };
    }
    // No S&S-supplied items at all (e.g. decoration-only) — nothing to place.
    // Resolve so the retry cron never picks this up again.
    await setPlacementState(db, orderId, 'placed');
    return { success: true, ssOrders: [], lineErrors: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shippingAddr = order.shipping_address as any;
  if (!shippingAddr) {
    // Definitive misconfiguration — nothing was sent to S&S, so this is a
    // safe-to-retry failure (not 'unknown'). Release the claim.
    const msg = 'Order has no shipping address';
    await setPlacementState(db, orderId, 'failed', {
      ss_auto_order_failed: true,
      ss_auto_order_error: msg,
    });
    return { success: false, ssOrders: [], lineErrors: [], error: msg };
  }

  // If the order includes decoration services, ship blanks to the Garment Decor
  // warehouse in Montclair so they can be decorated before forwarding to the customer.
  const hasDecoration = items.some(item => item.type === 'decoration');

  const GARMENT_DECOR_WAREHOUSE = {
    customer: 'Garment Decor',
    attn: 'Production Team',
    address: '4778 W Mission Blvd',
    city: 'Montclair',
    state: 'CA',
    zip: '91762',
    residential: false,
  };

  // Determine shipping speed
  const isExpress = (order as Record<string, unknown>).shipping_method === 'express';

  const payload: SSPlaceOrderPayload = {
    shippingAddress: hasDecoration ? GARMENT_DECOR_WAREHOUSE : {
      customer: shippingAddr.company || `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim(),
      attn: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim(),
      address: shippingAddr.address1 || shippingAddr.address || shippingAddr.street || '',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      zip: (shippingAddr.zipCode || shippingAddr.zip || '').substring(0, 5),
      residential: !shippingAddr.company,
    },
    shippingMethod: mapShippingMethod(
      (order as Record<string, unknown>).shipping_method as string | null,
      isExpress
    ),
    shipBlind: process.env.SS_SHIP_BLIND !== 'false',
    poNumber: order.order_number,
    emailConfirmation: process.env.SALES_NOTIFICATION_EMAIL || '',
    testOrder: process.env.NODE_ENV !== 'production',
    autoselectWarehouse: true,
    AutoSelectWarehouse_Preference: isExpress ? 'fastest' : 'fewest',
    AutoSelectWarehouse_Fewest_MaxDIT: 10,
    rejectLineErrors: false,
    // SS sends "line error" emails to emailConfirmation when true; we log in ss_activity_log instead.
    rejectLineErrors_Email: process.env.SS_REJECT_LINE_ERRORS_EMAIL === 'true',
    lines,
  };

  // Saved payment profiles (card/ECHECK) force prepay and override Net terms. Only attach when explicitly enabled.
  const useSavedPaymentProfile = process.env.SS_USE_PAYMENT_PROFILE === 'true';
  const profileId = process.env.SS_PAYMENT_PROFILE_ID;
  const profileEmail = process.env.SS_PAYMENT_EMAIL;
  if (useSavedPaymentProfile && profileId && profileEmail) {
    payload.paymentProfile = {
      email: profileEmail,
      profileID: parseInt(profileId, 10),
    };
  }

  await logSSActivity({
    orderId,
    activityType: 'order_placing',
    status: 'info',
    title: `Placing order with SS Activewear (${lines.length} line items${skippedItems.length > 0 ? `, ${skippedItems.length} non-SS items skipped` : ''}${hasDecoration ? ', shipping to GD warehouse for decoration' : ''})`,
    details: {
      po_number: order.order_number,
      line_count: lines.length,
      skipped_count: skippedItems.length,
      skipped_skus: skippedItems.length > 0 ? skippedItems.map((i) => i.sku || '(no sku)') : undefined,
      shipping_method: payload.shippingMethod,
      ship_to: hasDecoration ? 'Garment Decor Warehouse (Montclair)' : 'Customer address',
      has_decoration: hasDecoration,
      autoselect_warehouse: true,
      test_order: payload.testOrder,
    },
    supabase: db,
  });

  try {
    const rawResponse = await ssOrderRequest<SSOrderResponse[] | SSOrderWithLineErrors>(
      '/orders/',
      { method: 'POST', body: payload, timeoutMs: 60_000 }
    );

    // Parse response — SS API returns camelCase keys when rejectLineErrors is false:
    //   { orders: [...], lineErrors: [...] }
    // But may also return PascalCase or a plain array. Handle all cases.
    let ssOrders: SSOrderResponse[] = [];
    let lineErrors: Array<{ sku: string; identifier: string; qty: number; error: string }> = [];

    if (Array.isArray(rawResponse)) {
      ssOrders = rawResponse;
    } else {
      const wrapped = rawResponse as SSOrderWithLineErrors;
      ssOrders = wrapped.Orders || wrapped.orders || [];
      lineErrors = wrapped.LineErrors || wrapped.lineErrors || [];
    }

    console.log(`[SS Orders] POST response parsed: ${ssOrders.length} orders, ${lineErrors.length} line errors`);

    if (ssOrders.length === 0 && lineErrors.length === 0) {
      console.error('[SS Orders] WARNING: Both orders and lineErrors are empty. Raw response keys:', 
        Array.isArray(rawResponse) ? 'Array' : Object.keys(rawResponse as Record<string, unknown>));
    }

    if (ssOrders.length === 0 && lineErrors.length > 0) {
      // Total failure - all items rejected. Nothing was created at S&S, so this
      // is a safe-to-retry failure. Release the claim.
      await setPlacementState(db, orderId, 'failed', {
        ss_auto_order_failed: true,
        ss_auto_order_error: `All ${lineErrors.length} items rejected by SS Activewear`,
      });

      await logSSActivity({
        orderId,
        activityType: 'order_failed',
        status: 'error',
        title: `SS order failed — all ${lineErrors.length} items rejected`,
        details: { line_errors: lineErrors },
        supabase: db,
      });

      return { success: false, ssOrders: [], lineErrors, error: 'All items rejected' };
    }

    // Store each SS order in our database
    const { data: shipments } = await db
      .from('order_shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('shipment_index', { ascending: true });

    for (const ssOrder of ssOrders) {
      // Try to match to a shipment by warehouse
      const matchingShipment = shipments?.find(
        s => !s.ss_order_number
      );

      const { data: inserted } = await db.from('ss_orders').insert({
        order_id: orderId,
        shipment_id: matchingShipment?.id || null,
        ss_order_number: ssOrder.orderNumber,
        ss_invoice_number: ssOrder.invoiceNumber || null,
        ss_guid: ssOrder.guid,
        ss_warehouse: ssOrder.warehouseAbbr,
        ss_order_status: ssOrder.orderStatus,
        ss_delivery_status: ssOrder.deliveryStatus || null,
        ss_expected_delivery_date: ssOrder.expectedDeliveryDate || null,
        ss_tracking_number: ssOrder.trackingNumber || null,
        ss_carrier: ssOrder.shippingCarrier || null,
        ss_subtotal: ssOrder.subtotal,
        ss_shipping: ssOrder.shipping,
        ss_total: ssOrder.total,
        ss_total_weight: ssOrder.totalWeight,
        ss_total_boxes: ssOrder.totalBoxes,
        ss_raw_response: ssOrder as unknown as Record<string, unknown>,
        line_errors: lineErrors.length > 0 ? lineErrors as unknown as Record<string, unknown>[] : null,
      }).select().single();

      // Update the matching shipment with SS details
      if (matchingShipment) {
        await db.from('order_shipments').update({
          ss_order_number: ssOrder.orderNumber,
          ss_invoice_number: ssOrder.invoiceNumber || null,
          ss_guid: ssOrder.guid,
          expected_delivery_date: ssOrder.expectedDeliveryDate || null,
        }).eq('id', matchingShipment.id);
      }

      await logSSActivity({
        orderId,
        ssOrderId: inserted?.id || null,
        activityType: 'order_placed',
        status: 'success',
        title: `SS order #${ssOrder.orderNumber} placed successfully`,
        details: {
          ss_order_number: ssOrder.orderNumber,
          warehouse: ssOrder.warehouseAbbr,
          ss_status: ssOrder.orderStatus,
          expected_delivery: ssOrder.expectedDeliveryDate,
          total: ssOrder.total,
          total_pieces: ssOrder.totalPieces,
        },
        supabase: db,
      });
    }

    // Log line errors if any (partial fill)
    if (lineErrors.length > 0) {
      await logSSActivity({
        orderId,
        activityType: 'order_line_errors',
        status: 'warning',
        title: `${lineErrors.length} item(s) could not be fulfilled by SS Activewear`,
        details: { line_errors: lineErrors },
        supabase: db,
      });
    }

    // Update order status to "ordered"
    const updateData: Record<string, unknown> = {
      status: 'ordered',
      ordered_at: new Date().toISOString(),
      ss_auto_order_failed: false,
      ss_auto_order_error: null,
      ss_order_placement_state: 'placed',
      ss_order_placement_at: new Date().toISOString(),
    };

    // Set expected delivery from earliest SS order
    const deliveryDates = ssOrders
      .map(o => o.expectedDeliveryDate)
      .filter(Boolean)
      .sort();
    if (deliveryDates.length > 0) {
      updateData.expected_delivery_date = deliveryDates[deliveryDates.length - 1];
    }

    await db.from('orders').update(updateData).eq('id', orderId);

    // Log order activity for the general activity log too
    await db.from('order_activities').insert({
      order_id: orderId,
      activity_type: 'ordered',
      details: {
        ss_order_numbers: ssOrders.map(o => o.orderNumber),
        auto_ordered: true,
        line_errors_count: lineErrors.length,
      },
    });

    return { success: true, ssOrders, lineErrors };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const summary = summarizeSsPlaceOrderError(errorMsg);

    // The POST may have reached S&S and committed the order even though we hit a
    // timeout / 5xx / network / parse error before recording it. Mark the outcome
    // as 'unknown' (NOT 'failed') so the retry path verifies with S&S by PO before
    // re-sending — preventing the duplicate-order bug.
    await setPlacementState(db, orderId, 'unknown', {
      ss_auto_order_failed: true,
      ss_auto_order_error: summary,
    });

    await logSSActivity({
      orderId,
      activityType: 'order_failed',
      status: 'error',
      title: 'SS Activewear order outcome undetermined — will verify before any re-send',
      details: { error: errorMsg, summary, outcome: 'unknown', placement_state: 'unknown' },
      supabase: db,
    });

    return { success: false, ssOrders: [], lineErrors: [], error: summary };
  }
}

// ------------------------------------------------------------------
// GET ORDER STATUS from SS Activewear
// ------------------------------------------------------------------

export async function getSSOrderStatus(
  ssOrderNumber: string
): Promise<SSOrderResponse | null> {
  try {
    const response = await ssOrderRequest<SSOrderResponse[]>(
      `/orders/${ssOrderNumber}`
    );
    return response?.[0] || null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// CANCEL SS ORDER (within 10-minute window)
// ------------------------------------------------------------------

export async function cancelSSOrder(
  orderId: string,
  ssOrderNumber: string,
  supabase?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const db = supabase || getServiceSupabase();

  const { data: ssOrder } = await db
    .from('ss_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('ss_order_number', ssOrderNumber)
    .single();

  if (!ssOrder) {
    return { success: false, error: 'SS order not found' };
  }

  // Check 10-minute window
  const placedAt = new Date(ssOrder.placed_at).getTime();
  const elapsed = Date.now() - placedAt;
  const TEN_MINUTES = 10 * 60 * 1000;

  if (elapsed > TEN_MINUTES) {
    await logSSActivity({
      orderId,
      ssOrderId: ssOrder.id,
      activityType: 'cancel_failed',
      status: 'error',
      title: `Cannot cancel SS order #${ssOrderNumber} — 10-minute window expired`,
      details: { elapsed_ms: elapsed, placed_at: ssOrder.placed_at },
      supabase: db,
    });
    return { success: false, error: '10-minute cancellation window has expired' };
  }

  try {
    await ssOrderRequest<SSOrderResponse[]>(
      `/orders/${ssOrderNumber}`,
      { method: 'DELETE' }
    );

    await db.from('ss_orders').update({
      ss_order_status: 'Cancelled',
      updated_at: new Date().toISOString(),
    }).eq('id', ssOrder.id);

    await logSSActivity({
      orderId,
      ssOrderId: ssOrder.id,
      activityType: 'order_cancelled',
      status: 'success',
      title: `SS order #${ssOrderNumber} cancelled successfully`,
      supabase: db,
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await logSSActivity({
      orderId,
      ssOrderId: ssOrder.id,
      activityType: 'cancel_failed',
      status: 'error',
      title: `Failed to cancel SS order #${ssOrderNumber}`,
      details: { error: errorMsg },
      supabase: db,
    });
    return { success: false, error: errorMsg };
  }
}

// ------------------------------------------------------------------
// POLL TRACKING for all open SS orders
// ------------------------------------------------------------------

interface SSTrackingResponse {
  carrierName: string;
  trackingNumber: string;
  origin: string;
  actualDeliveryDateTime: string | null;
  signedBy: string | null;
  latestCheckpoint: {
    checkpointDate: string;
    checkpointTime: string;
    checkpointLocation: string;
    checkpointStatusMessage: string;
  } | null;
  orderNumber: string;
  invoiceNumber: string;
}

export async function pollTrackingUpdates(
  supabase?: SupabaseClient
): Promise<{ ordersChecked: number; updated: number; errors: number }> {
  const db = supabase || getServiceSupabase();
  let ordersChecked = 0;
  let updated = 0;
  let errors = 0;

  // Find all SS orders that are not yet delivered or cancelled
  const { data: openSSOrders } = await db
    .from('ss_orders')
    .select('*, orders!inner(id, order_number, status, customer_email, customer_name, items, shipping_address, carrier, tracking_number)')
    .not('ss_order_status', 'in', '("Shipped - Delivered","Cancelled","Completed")')
    .order('last_polled_at', { ascending: true, nullsFirst: true })
    .limit(50);

  if (!openSSOrders || openSSOrders.length === 0) return { ordersChecked: 0, updated: 0, errors: 0 };

  for (const ssOrder of openSSOrders) {
    ordersChecked++;
    try {
      // 1. Check order status
      const ssStatus = await getSSOrderStatus(ssOrder.ss_order_number);
      if (!ssStatus) {
        await db.from('ss_orders').update({ last_polled_at: new Date().toISOString() }).eq('id', ssOrder.id);
        continue;
      }

      const statusChanged = ssStatus.orderStatus !== ssOrder.ss_order_status;
      const trackingFound = ssStatus.trackingNumber && !ssOrder.ss_tracking_number;

      // Update SS order record
      await db.from('ss_orders').update({
        ss_order_status: ssStatus.orderStatus,
        ss_delivery_status: ssStatus.deliveryStatus || null,
        ss_tracking_number: ssStatus.trackingNumber || ssOrder.ss_tracking_number,
        ss_carrier: ssStatus.shippingCarrier || ssOrder.ss_carrier,
        ss_ship_date: ssStatus.shipDate || ssOrder.ss_ship_date,
        ss_invoice_number: ssStatus.invoiceNumber || ssOrder.ss_invoice_number,
        ss_expected_delivery_date: ssStatus.expectedDeliveryDate || ssOrder.ss_expected_delivery_date,
        last_polled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', ssOrder.id);

      // 2. If tracking number is now available, fetch detailed tracking data
      const trackingNumber = ssStatus.trackingNumber || ssOrder.ss_tracking_number;
      if (trackingNumber) {
        try {
          const trackingData = await ssOrderRequest<SSTrackingResponse[]>(
            `/TrackingDataByOrderNum/${ssOrder.ss_order_number}`
          );

          if (trackingData?.[0]) {
            const td = trackingData[0];
            if (td.latestCheckpoint) {
              await db.from('ss_tracking_events').insert({
                ss_order_id: ssOrder.id,
                tracking_number: td.trackingNumber,
                carrier: td.carrierName,
                checkpoint_date: td.latestCheckpoint.checkpointDate
                  ? new Date(`${td.latestCheckpoint.checkpointDate} ${td.latestCheckpoint.checkpointTime}`).toISOString()
                  : null,
                checkpoint_location: td.latestCheckpoint.checkpointLocation,
                checkpoint_status: td.latestCheckpoint.checkpointStatusMessage,
                actual_delivery_date: td.actualDeliveryDateTime || null,
                signed_by: td.signedBy || null,
                raw_response: td as unknown as Record<string, unknown>,
              });
            }

            // Update shipment with checkpoint info
            if (ssOrder.shipment_id) {
              await db.from('order_shipments').update({
                tracking_number: trackingNumber,
                carrier: td.carrierName?.toLowerCase() || ssStatus.shippingCarrier?.toLowerCase() || null,
                delivery_status: ssStatus.deliveryStatus || null,
                last_checkpoint_location: td.latestCheckpoint?.checkpointLocation || null,
                last_checkpoint_message: td.latestCheckpoint?.checkpointStatusMessage || null,
                last_checkpoint_at: td.latestCheckpoint?.checkpointDate
                  ? new Date(`${td.latestCheckpoint.checkpointDate} ${td.latestCheckpoint.checkpointTime}`).toISOString()
                  : null,
                shipped_at: ssStatus.shipDate || new Date().toISOString(),
              }).eq('id', ssOrder.shipment_id);
            }
          }
        } catch (trackErr) {
          console.error(`[SS Tracking] Failed to fetch tracking for ${ssOrder.ss_order_number}:`, trackErr);
        }
      }

      // 3. Handle status transitions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentOrder = (ssOrder as any).orders;
      const parentOrderId = parentOrder?.id || ssOrder.order_id;

      if (trackingFound && trackingNumber) {
        await logSSActivity({
          orderId: parentOrderId,
          ssOrderId: ssOrder.id,
          activityType: 'tracking_received',
          status: 'success',
          title: `Tracking number received for SS order #${ssOrder.ss_order_number}`,
          details: {
            tracking_number: trackingNumber,
            carrier: ssStatus.shippingCarrier,
            delivery_status: ssStatus.deliveryStatus,
          },
          supabase: db,
        });

        // Update parent order tracking
        await db.from('orders').update({
          tracking_number: trackingNumber,
          carrier: ssStatus.shippingCarrier?.toLowerCase() || null,
        }).eq('id', parentOrderId);

        // Check if ALL ss_orders for this parent order now have tracking
        const { data: allSSOrders } = await db
          .from('ss_orders')
          .select('ss_tracking_number')
          .eq('order_id', parentOrderId);

        const allHaveTracking = allSSOrders?.every(o => o.ss_tracking_number);
        const someHaveTracking = allSSOrders?.some(o => o.ss_tracking_number);

        if (allHaveTracking && parentOrder?.status !== 'shipped' && parentOrder?.status !== 'delivered') {
          await db.from('orders').update({
            status: 'shipped',
            shipped_at: new Date().toISOString(),
          }).eq('id', parentOrderId);

          await db.from('order_activities').insert({
            order_id: parentOrderId,
            activity_type: 'shipped',
            details: {
              tracking_number: trackingNumber,
              carrier: ssStatus.shippingCarrier,
              auto_updated: true,
            },
          });

          await logSSActivity({
            orderId: parentOrderId,
            activityType: 'order_shipped',
            status: 'success',
            title: 'All shipments have tracking — order marked as shipped',
            details: { ss_orders: allSSOrders?.length },
            supabase: db,
          });

          // Trigger shipping email
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/order-shipped`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: parentOrderId }),
            });
          } catch {
            // Non-blocking
          }

          updated++;
        } else if (someHaveTracking && !allHaveTracking && parentOrder?.status !== 'partially_shipped') {
          await db.from('orders').update({ status: 'partially_shipped' }).eq('id', parentOrderId);

          await logSSActivity({
            orderId: parentOrderId,
            activityType: 'partially_shipped',
            status: 'info',
            title: 'Some shipments have tracking — order marked as partially shipped',
            supabase: db,
          });
        }
      }

      // Handle delivery
      if (ssStatus.deliveryStatus?.includes('Delivered') || ssStatus.orderStatus === 'Completed') {
        const { data: allSSForDelivery } = await db
          .from('ss_orders')
          .select('ss_order_status, ss_delivery_status')
          .eq('order_id', parentOrderId);

        const allDelivered = allSSForDelivery?.every(
          o => o.ss_delivery_status?.includes('Delivered') || o.ss_order_status === 'Completed'
        );

        if (allDelivered && parentOrder?.status !== 'delivered') {
          await db.from('orders').update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          }).eq('id', parentOrderId);

          await db.from('order_activities').insert({
            order_id: parentOrderId,
            activity_type: 'delivered',
            details: { auto_updated: true },
          });

          await logSSActivity({
            orderId: parentOrderId,
            activityType: 'order_delivered',
            status: 'success',
            title: 'All shipments delivered — order marked as delivered',
            supabase: db,
          });

          updated++;
        }
      }

      if (statusChanged) {
        await logSSActivity({
          orderId: parentOrderId,
          ssOrderId: ssOrder.id,
          activityType: 'status_polled',
          status: 'info',
          title: `SS order #${ssOrder.ss_order_number} status: ${ssStatus.orderStatus}`,
          details: {
            previous_status: ssOrder.ss_order_status,
            new_status: ssStatus.orderStatus,
            delivery_status: ssStatus.deliveryStatus,
          },
          supabase: db,
        });
      }

    } catch (error) {
      errors++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SS Tracking] Error checking ${ssOrder.ss_order_number}:`, errorMsg);

      await logSSActivity({
        orderId: ssOrder.order_id,
        ssOrderId: ssOrder.id,
        activityType: 'tracking_poll_error',
        status: 'error',
        title: `Failed to poll SS order #${ssOrder.ss_order_number}`,
        details: { error: errorMsg },
        supabase: db,
      });
    }
  }

  return { ordersChecked, updated, errors };
}

// ------------------------------------------------------------------
// RETRY FAILED ORDERS
// ------------------------------------------------------------------

export async function retryFailedOrders(
  supabase?: SupabaseClient
): Promise<{ retried: number; succeeded: number; failed: number }> {
  const db = supabase || getServiceSupabase();

  // Pick up both definitive failures and undetermined ('unknown') outcomes.
  // placeSSOrder will verify each with S&S by PO before re-sending, so this can
  // never duplicate an order that actually succeeded.
  const { data: failedOrders } = await db
    .from('orders')
    .select('id, order_number')
    .in('ss_order_placement_state', ['failed', 'unknown'])
    .eq('status', 'awaiting_purchasing')
    .eq('payment_status', 'paid')
    .limit(10);

  if (!failedOrders || failedOrders.length === 0) {
    return { retried: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const order of failedOrders) {
    await logSSActivity({
      orderId: order.id,
      activityType: 'order_retry',
      status: 'info',
      title: `Retrying SS auto-order for ${order.order_number}`,
      supabase: db,
    });

    // placeSSOrder re-claims this order (state is 'failed'/'unknown') and runs
    // verify-before-resend: it reconciles instead of re-sending if S&S already
    // has the order, so retries are idempotent.
    const result = await placeSSOrder(order.id, db);
    if (result.success) succeeded++;
    else failed++;
  }

  return { retried: failedOrders.length, succeeded, failed };
}

// ------------------------------------------------------------------
// DAYS IN TRANSIT
// ------------------------------------------------------------------

interface SSDaysInTransitResponse {
  zipCode: string;
  warehouses?: Array<{
    warehouseAbbr: string;
    cutOffTime: string;
    daysInTransit: number;
  }>;
  warehouseAbbr?: string;
  cutOffTime?: string;
  daysInTransit?: number;
}

export interface DeliveryEstimate {
  warehouseAbbr: string;
  daysInTransit: number;
  cutoffTime: string;
  estimatedDeliveryDate: string;
  orderByCutoff: boolean;
}

export async function getDaysInTransit(
  zipCode: string,
  supabase?: SupabaseClient
): Promise<DeliveryEstimate[]> {
  const db = supabase || getServiceSupabase();
  const zip5 = zipCode.substring(0, 5);

  // Check cache first (24hr TTL)
  const { data: cached } = await db
    .from('delivery_estimates_cache')
    .select('*')
    .eq('zip_code', zip5);

  const now = new Date();
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  if (cached && cached.length > 0) {
    const cacheAge = now.getTime() - new Date(cached[0].cached_at).getTime();
    if (cacheAge < CACHE_TTL) {
      return cached.map(c => buildEstimate(c.warehouse_abbr, c.days_in_transit, c.cutoff_time));
    }
  }

  // Fetch from SS API
  const response = await ssOrderRequest<SSDaysInTransitResponse[]>(`/daysintransit/${zip5}`);

  if (!response || response.length === 0) return [];

  const estimates: DeliveryEstimate[] = [];
  const cacheRows: Array<{ zip_code: string; warehouse_abbr: string; days_in_transit: number; cutoff_time: string }> = [];

  for (const entry of response) {
    // SS API nests warehouses inside each entry, plus has top-level fields
    const warehouses = entry.warehouses || [];
    if (entry.warehouseAbbr && entry.daysInTransit !== undefined) {
      warehouses.push({
        warehouseAbbr: entry.warehouseAbbr,
        cutOffTime: entry.cutOffTime || '',
        daysInTransit: entry.daysInTransit,
      });
    }

    for (const wh of warehouses) {
      estimates.push(buildEstimate(wh.warehouseAbbr, wh.daysInTransit, wh.cutOffTime));
      cacheRows.push({
        zip_code: zip5,
        warehouse_abbr: wh.warehouseAbbr,
        days_in_transit: wh.daysInTransit,
        cutoff_time: wh.cutOffTime,
      });
    }
  }

  // Upsert cache
  if (cacheRows.length > 0) {
    for (const row of cacheRows) {
      await db.from('delivery_estimates_cache').upsert(
        { ...row, cached_at: now.toISOString() },
        { onConflict: 'zip_code,warehouse_abbr' }
      );
    }
  }

  return estimates;
}

function buildEstimate(warehouseAbbr: string, daysInTransit: number, cutoffTime: string): DeliveryEstimate {
  const now = new Date();
  const cutoffMatch = cutoffTime.match(/(\d+):(\d+)\s*(CT|ET|PT|MT)?/i);
  let orderByCutoff = true;

  if (cutoffMatch) {
    let cutoffHour = parseInt(cutoffMatch[1], 10);
    const tz = (cutoffMatch[3] || 'CT').toUpperCase();
    const tzMap: Record<string, string> = { ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver', PT: 'America/Los_Angeles' };
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tzMap[tz] || 'America/Chicago' }));
    if (nowInTz.getHours() >= cutoffHour) {
      orderByCutoff = false;
    }
  }

  // Calculate estimated delivery: today + daysInTransit (+ 1 if past cutoff)
  const businessDays = daysInTransit + (orderByCutoff ? 0 : 1);
  const deliveryDate = addBusinessDays(now, businessDays);

  return {
    warehouseAbbr,
    daysInTransit,
    cutoffTime,
    estimatedDeliveryDate: deliveryDate.toISOString(),
    orderByCutoff,
  };
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

// ------------------------------------------------------------------
// GET SS INVOICE (PDF)
// ------------------------------------------------------------------

export async function getSSInvoice(invoiceNumber: string): Promise<ArrayBuffer | null> {
  await waitForRateLimit();

  const response = await fetch(`${SS_BASE_URL}/Invoices/${invoiceNumber}`, {
    headers: { Authorization: getSSAuthHeader() },
    cache: 'no-store',
  });

  if (!response.ok) return null;
  return response.arrayBuffer();
}
