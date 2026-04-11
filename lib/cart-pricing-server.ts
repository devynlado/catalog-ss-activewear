import type { CartItem } from './database.types';
import { createServerSupabaseClient } from './supabase';
import {
  getBaseTierPrice,
  getEffectiveItemPrice,
  getListPriceForCartItem,
  hasTieredPricing,
} from './tiered-pricing';

/** Effective retail for a SKU row (matches product page: sale when lower than retail). */
export function listPriceFromSkuRow(retail: unknown, sale: unknown): number {
  const r = Number(retail) || 0;
  const s = sale != null && sale !== '' ? Number(sale) : NaN;
  if (s > 0 && s < r) return s;
  return r;
}

export async function fetchSkuListPricesBySku(skus: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const unique = [...new Set(skus.filter(Boolean))];
  if (unique.length === 0) return map;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('product_skus')
    .select('sku, retail_price, sale_price')
    .in('sku', unique);

  if (error || !data) return map;

  for (const row of data as { sku: string; retail_price: unknown; sale_price: unknown }[]) {
    if (row.sku) {
      map.set(row.sku, listPriceFromSkuRow(row.retail_price, row.sale_price));
    }
  }
  return map;
}

/**
 * If the cart line has a Google-style discount but only snapshot prices, derive
 * the discount fraction from those snapshots (before unitPrice is refreshed).
 */
export function enrichGoogleDiscountPercent(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    if (
      item.googleDiscountPercent != null &&
      item.googleDiscountPercent > 0 &&
      item.googleDiscountPercent < 1
    ) {
      return item;
    }
    if (
      item.unitPrice > 0 &&
      item.discountedPrice != null &&
      item.discountedPrice > 0 &&
      item.discountedPrice < item.unitPrice
    ) {
      const inferred = 1 - item.discountedPrice / item.unitPrice;
      if (inferred > 0 && inferred < 1) {
        return { ...item, googleDiscountPercent: Math.round(inferred * 1e6) / 1e6 };
      }
    }
    return item;
  });
}

/**
 * Refresh list `unitPrice` from DB for non-tiered SKUs; align tiered lines to
 * current tier-1 base from code so list price matches checkout logic.
 */
export function normalizeCartListPrices(
  items: CartItem[],
  priceBySku: Map<string, number>,
): CartItem[] {
  return items.map((item) => {
    if (item.overrideUnitPrice != null && item.overrideUnitPrice > 0) {
      return item;
    }
    if (hasTieredPricing(item.styleId)) {
      const base = getBaseTierPrice(item.styleId, item.sizeName);
      if (base != null && base > 0) {
        return { ...item, unitPrice: base };
      }
      return item;
    }
    const fresh = priceBySku.get(item.sku);
    if (fresh != null && fresh > 0) {
      return { ...item, unitPrice: fresh };
    }
    return item;
  });
}

export async function prepareCartItemsForPricing(items: CartItem[]): Promise<CartItem[]> {
  const enriched = enrichGoogleDiscountPercent(items);
  const priceBySku = await fetchSkuListPricesBySku(enriched.map((i) => i.sku));
  return normalizeCartListPrices(enriched, priceBySku);
}

/** Row shape stored on `orders.items` for purchased products. */
export function toOrderProductRow(
  item: CartItem,
  totalStyleQty: number,
  options?: { cogs?: number | null },
) {
  const list = getListPriceForCartItem(item);
  const eff = getEffectiveItemPrice(item, totalStyleQty);
  const hasDiscount = eff + 1e-6 < list;
  return {
    type: 'product' as const,
    sku: item.sku,
    styleId: item.styleId,
    styleName: item.styleName,
    brandName: item.brandName,
    colorName: item.colorName,
    colorCode: item.colorCode,
    sizeName: item.sizeName,
    quantity: item.quantity,
    unitPrice: list,
    discountedPrice: hasDiscount ? eff : undefined,
    imageUrl: item.imageUrl,
    ...(options && 'cogs' in options ? { cogs: options.cogs ?? null } : {}),
  };
}
