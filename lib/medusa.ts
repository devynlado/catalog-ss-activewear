/**
 * Medusa order sync – push confirmed orders to Medusa for order management (OMS).
 * Requires a Medusa backend with a custom sync endpoint (see docs/MEDUSA_SETUP.md).
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL;
const MEDUSA_SYNC_API_KEY = process.env.MEDUSA_SYNC_API_KEY;

/** Address shape we store (Supabase) – may use address or address1 */
interface StoredAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  address1?: string;
  address2?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

/** Line item from our orders (cart item or package item) */
interface OrderItemRow {
  sku?: string;
  styleId?: number;
  styleName?: string;
  productName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  discountedPrice?: number;
  type?: string;
  packageType?: string;
  totalQuantity?: number;
  subtotal?: number;
  [key: string]: unknown;
}

/** Order row from Supabase (minimal shape needed for sync) */
export interface OrderForMedusaSync {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  company?: string | null;
  items: OrderItemRow[] | unknown;
  subtotal: number;
  shipping_cost?: number;
  tax_amount?: number;
  total: number;
  shipping_address?: StoredAddress | null;
  billing_address?: StoredAddress | null;
  payment_status?: string;
  metadata?: Record<string, unknown> | null;
}

/** Payload we send to Medusa custom sync endpoint */
export interface MedusaSyncOrderPayload {
  source: 'catalog-ss-activewear';
  order_id: string;
  order_number: string;
  email: string;
  currency_code: string;
  status: 'pending' | 'confirmed';
  customer_name?: string | null;
  customer_phone?: string | null;
  company?: string | null;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    sku?: string;
    metadata?: Record<string, unknown>;
  }>;
  shipping_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
    phone?: string;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
    phone?: string;
  };
  shipping_methods?: Array<{
    name: string;
    amount: number;
  }>;
  metadata?: Record<string, unknown>;
}

function normalizeAddress(addr: StoredAddress | null | undefined): MedusaSyncOrderPayload['shipping_address'] | undefined {
  if (!addr || (!addr.address && !addr.address1)) return undefined;
  const line1 = addr.address ?? addr.address1 ?? '';
  const line2 = addr.address2 ?? addr.apartment ?? '';
  return {
    first_name: addr.firstName ?? '',
    last_name: addr.lastName ?? '',
    company: addr.company,
    address_1: line2 ? `${line1}, ${line2}` : line1,
    city: addr.city ?? '',
    province: addr.state ?? '',
    postal_code: (addr.zipCode ?? addr.zip ?? '').toString(),
    country_code: (addr.country ?? 'us').toLowerCase().slice(0, 2),
    phone: addr.phone,
  };
}

/** Convert to cents for Medusa (unit_price in smallest currency unit). */
function itemsToMedusaItems(items: OrderItemRow[]): MedusaSyncOrderPayload['items'] {
  return items.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPriceDollars = Number(item.unitPrice ?? item.discountedPrice ?? 0) || 0;
    const unitPriceCents = Math.round(unitPriceDollars * 100);
    const title =
      typeof item.productName === 'string'
        ? item.productName
        : typeof item.styleName === 'string'
          ? `Style ${item.styleName}${item.colorName ? ` - ${item.colorName}` : ''}`
          : typeof item.packageType === 'string'
            ? `Package: ${item.packageType}${item.productName ? ` - ${item.productName}` : ''}`
            : 'Item';
    return {
      title: title.slice(0, 255),
      quantity: qty,
      unit_price: unitPriceCents,
      sku: typeof item.sku === 'string' ? item.sku : undefined,
      metadata: {
        style_id: item.styleId,
        color_name: item.colorName,
        size_name: item.sizeName,
        source_order_id: undefined as string | undefined,
      },
    };
  });
}

/**
 * Build the payload to send to Medusa sync endpoint from a Supabase order.
 */
export function buildMedusaSyncPayload(order: OrderForMedusaSync): MedusaSyncOrderPayload {
  const rawItems = Array.isArray(order.items) ? order.items as OrderItemRow[] : [];
  // Package orders store a single item object with nested colors; normalize to one line item
  const items: OrderItemRow[] =
    rawItems.length > 0
      ? rawItems
      : order.items && typeof order.items === 'object' && !Array.isArray(order.items)
        ? [
            {
              productName: (order.items as { productName?: string }).productName ?? 'Package order',
              quantity: (order.items as { totalQuantity?: number }).totalQuantity ?? 1,
              unitPrice: (order.items as { subtotal?: number }).subtotal ?? order.subtotal,
              subtotal: (order.items as { subtotal?: number }).subtotal ?? order.subtotal,
              type: 'package',
            } as OrderItemRow,
          ]
        : [];

  const shipping = normalizeAddress(order.shipping_address ?? undefined);
  const billing = normalizeAddress(order.billing_address ?? undefined);
  const isConfirmed = order.payment_status === 'paid';

  return {
    source: 'catalog-ss-activewear',
    order_id: order.id,
    order_number: order.order_number,
    email: order.customer_email,
    currency_code: 'usd',
    status: isConfirmed ? 'confirmed' : 'pending',
    customer_name: order.customer_name ?? undefined,
    customer_phone: order.customer_phone ?? undefined,
    company: order.company ?? undefined,
    items: itemsToMedusaItems(items),
    shipping_address: shipping,
    billing_address: billing ?? shipping,
    shipping_methods:
      typeof order.shipping_cost === 'number' && order.shipping_cost > 0
        ? [{ name: 'Shipping', amount: Math.round(order.shipping_cost * 100) }] // amount in cents
        : undefined,
    metadata: {
      internal_order_id: order.id,
      order_number: order.order_number,
      ...(order.metadata && typeof order.metadata === 'object' ? order.metadata : {}),
    },
  };
}

/**
 * Send order to Medusa backend for order management. Fire-and-forget; logs errors but does not throw.
 * Call this after order is created or when payment succeeds.
 */
export async function syncOrderToMedusa(order: OrderForMedusaSync): Promise<{ ok: boolean; medusa_order_id?: string }> {
  if (!MEDUSA_BACKEND_URL?.trim()) {
    return { ok: false };
  }
  const url = `${MEDUSA_BACKEND_URL.replace(/\/$/, '')}/sync/order`;
  const apiKey = MEDUSA_SYNC_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Medusa] MEDUSA_SYNC_API_KEY not set; skipping sync for order', order.order_number);
    return { ok: false };
  }

  const payload = buildMedusaSyncPayload(order);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-medusa-sync-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Medusa] Sync failed for order', order.order_number, res.status, text);
      return { ok: false };
    }
    const data = (await res.json()) as { id?: string; order_id?: string };
    const medusaOrderId = data?.id ?? data?.order_id;
    if (medusaOrderId) {
      console.log('[Medusa] Synced order', order.order_number, '-> Medusa order', medusaOrderId);
    }
    return { ok: true, medusa_order_id: medusaOrderId };
  } catch (err) {
    console.error('[Medusa] Sync error for order', order.order_number, err);
    return { ok: false };
  }
}
