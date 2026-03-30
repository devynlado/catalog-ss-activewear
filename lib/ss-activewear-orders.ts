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
  LineErrors?: Array<{
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

  // Kill switch
  if (process.env.SS_AUTO_ORDER_ENABLED === 'false') {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'warning',
      title: 'Auto-ordering disabled (kill switch)',
      details: { reason: 'SS_AUTO_ORDER_ENABLED is false' },
      supabase: db,
    });
    return { success: false, ssOrders: [], lineErrors: [], error: 'Auto-ordering disabled' };
  }

  // Fetch order with shipments
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Idempotency: check if we already placed an SS order for this order
  const { data: existingSS } = await db
    .from('ss_orders')
    .select('id, ss_order_number')
    .eq('order_id', orderId);

  if (existingSS && existingSS.length > 0) {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'info',
      title: 'SS order already exists (idempotency check)',
      details: { existing_ss_orders: existingSS.map(s => s.ss_order_number) },
      supabase: db,
    });
    return { success: true, ssOrders: [], lineErrors: [], error: 'Already placed' };
  }

  // Build order lines — only include items supplied by SS Activewear
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const productItems = items.filter(item => item.type !== 'decoration');
  const skus = productItems.map((item) => item.sku).filter(Boolean);

  // Look up actual supplier for each SKU from the product_skus table
  let ssSkuSet = new Set<string>();
  if (skus.length > 0) {
    const { data: skuRows } = await db
      .from('product_skus')
      .select('sku, supplier')
      .in('sku', skus);
    ssSkuSet = new Set(
      (skuRows || [])
        .filter((r: { sku: string; supplier: string | null }) => r.supplier === 'ss_activewear')
        .map((r: { sku: string }) => r.sku)
    );
  }

  const lines: SSOrderLine[] = productItems
    .filter(item => ssSkuSet.has(item.sku))
    .map(item => ({
      identifier: item.sku,
      qty: item.quantity || 1,
    }));

  const skippedItems = productItems.filter(item => !ssSkuSet.has(item.sku));

  if (lines.length === 0) {
    await logSSActivity({
      orderId,
      activityType: 'auto_order_skipped',
      status: 'info',
      title: 'No SS Activewear items in this order',
      details: skippedItems.length > 0
        ? { skipped_skus: skippedItems.map((i: { sku: string; brandName?: string }) => i.sku), reason: 'Items belong to other suppliers' }
        : undefined,
      supabase: db,
    });
    return { success: true, ssOrders: [], lineErrors: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shippingAddr = order.shipping_address as any;
  if (!shippingAddr) {
    throw new Error('Order has no shipping address');
  }

  // Determine shipping speed
  const isExpress = (order as Record<string, unknown>).shipping_method === 'express';

  const payload: SSPlaceOrderPayload = {
    shippingAddress: {
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
    rejectLineErrors_Email: true,
    lines,
  };

  // Add payment profile if configured
  const profileId = process.env.SS_PAYMENT_PROFILE_ID;
  const profileEmail = process.env.SS_PAYMENT_EMAIL;
  if (profileId && profileEmail) {
    payload.paymentProfile = {
      email: profileEmail,
      profileID: parseInt(profileId, 10),
    };
  }

  await logSSActivity({
    orderId,
    activityType: 'order_placing',
    status: 'info',
    title: `Placing order with SS Activewear (${lines.length} line items${skippedItems.length > 0 ? `, ${skippedItems.length} non-SS items skipped` : ''})`,
    details: {
      po_number: order.order_number,
      line_count: lines.length,
      skipped_count: skippedItems.length,
      skipped_skus: skippedItems.length > 0 ? skippedItems.map((i: { sku: string }) => i.sku) : undefined,
      shipping_method: payload.shippingMethod,
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

    // Parse response (may be array of orders or object with Orders + LineErrors)
    let ssOrders: SSOrderResponse[] = [];
    let lineErrors: Array<{ sku: string; identifier: string; qty: number; error: string }> = [];

    if (Array.isArray(rawResponse)) {
      ssOrders = rawResponse;
    } else {
      ssOrders = (rawResponse as SSOrderWithLineErrors).Orders || [];
      lineErrors = (rawResponse as SSOrderWithLineErrors).LineErrors || [];
    }

    if (ssOrders.length === 0 && lineErrors.length > 0) {
      // Total failure - all items rejected
      await db.from('orders').update({
        ss_auto_order_failed: true,
        ss_auto_order_error: `All ${lineErrors.length} items rejected by SS Activewear`,
      }).eq('id', orderId);

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

    await db.from('orders').update({
      ss_auto_order_failed: true,
      ss_auto_order_error: errorMsg,
    }).eq('id', orderId);

    await logSSActivity({
      orderId,
      activityType: 'order_failed',
      status: 'error',
      title: 'Failed to place SS Activewear order',
      details: { error: errorMsg },
      supabase: db,
    });

    return { success: false, ssOrders: [], lineErrors: [], error: errorMsg };
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

  const { data: failedOrders } = await db
    .from('orders')
    .select('id, order_number')
    .eq('ss_auto_order_failed', true)
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

    // Clear the failure flag so placeSSOrder doesn't skip due to idempotency
    // (it checks ss_orders table, not the flag)
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
