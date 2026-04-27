import type { CartItem } from './database.types';
import { createServerSupabaseClient } from './supabase';

/**
 * Resolve the effective per-line minimum order quantity for a variant.
 *
 *   variant override (product_skus.min_order_quantity)
 *     ↳ falls back to ↳
 *   style default     (products.min_order_quantity)
 *     ↳ falls back to ↳
 *   no minimum        (null)
 *
 * NOTE: The minimum is enforced **per cart line / per variant**, never as a
 * sum across SKUs. Two different sizes of the same color each carry their own
 * minimum independently.
 */
export function resolveMinOrderQuantity(
  styleDefault: number | null | undefined,
  variantOverride: number | null | undefined,
): number | null {
  if (typeof variantOverride === 'number' && variantOverride >= 1) {
    return variantOverride;
  }
  if (typeof styleDefault === 'number' && styleDefault >= 1) {
    return styleDefault;
  }
  return null;
}

export interface MinQuantityViolation {
  sku: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  minimum: number;
}

/**
 * Format a single violation into a human-readable sentence. Used both by the
 * server (in API error responses) and the client (cart and PDP banners) so
 * customers see consistent wording.
 */
export function formatMinQuantityMessage(v: MinQuantityViolation): string {
  return `${v.brandName} ${v.styleName} — ${v.colorName} / ${v.sizeName} requires at least ${v.minimum} pieces (you have ${v.quantity}).`;
}

/**
 * Look up the fresh effective minimum for each SKU. Returns a map keyed by
 * SKU. **Only SKUs we successfully resolved are present in the map** —
 * callers can use `.has(sku)` to distinguish "lookup succeeded, no minimum
 * applies" (value `null`) from "lookup failed / SKU unknown" (key absent),
 * so callers can decide whether to fall back to a previous snapshot.
 *
 * Implemented as two plain SELECTs to avoid PostgREST relationship-syntax
 * ambiguity. Cheap: both queries are indexed lookups.
 */
export async function fetchEffectiveMinimumsBySku(
  skus: string[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  const unique = [...new Set(skus.filter(Boolean))];
  if (unique.length === 0) return out;

  const supabase = createServerSupabaseClient();

  const { data: skuRows, error: skuError } = await supabase
    .from('product_skus')
    .select('sku, style_id, min_order_quantity')
    .in('sku', unique);

  if (skuError || !skuRows) {
    if (skuError) console.error('[product-rules] product_skus query failed:', skuError);
    return out;
  }

  const styleIds = [...new Set(
    (skuRows as Array<{ style_id: number | null }>)
      .map((r) => r.style_id)
      .filter((id): id is number => typeof id === 'number'),
  )];

  const styleMinByStyleId = new Map<number, number | null>();
  if (styleIds.length > 0) {
    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('style_id, min_order_quantity')
      .in('style_id', styleIds);

    if (productError) {
      console.error('[product-rules] products query failed:', productError);
    } else if (productRows) {
      for (const row of productRows as Array<{ style_id: number; min_order_quantity: number | null }>) {
        styleMinByStyleId.set(row.style_id, row.min_order_quantity ?? null);
      }
    }
  }

  for (const row of skuRows as Array<{
    sku: string;
    style_id: number | null;
    min_order_quantity: number | null;
  }>) {
    if (!row.sku) continue;
    const styleDefault =
      row.style_id != null ? styleMinByStyleId.get(row.style_id) ?? null : null;
    out.set(row.sku, resolveMinOrderQuantity(styleDefault, row.min_order_quantity));
  }
  return out;
}

/**
 * Server-side gate. Given a cart, returns every line that would violate its
 * effective minimum. Empty array ⇒ all good.
 *
 * Items with `quantity <= 0` are skipped (treated as "remove me" elsewhere).
 */
export async function validateCartMinimumQuantities(
  items: CartItem[],
): Promise<MinQuantityViolation[]> {
  if (items.length === 0) return [];
  const minBySku = await fetchEffectiveMinimumsBySku(items.map((i) => i.sku));

  const violations: MinQuantityViolation[] = [];
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const min = minBySku.get(item.sku);
    if (min == null) continue;
    if (item.quantity < min) {
      violations.push({
        sku: item.sku,
        styleName: item.styleName,
        brandName: item.brandName,
        colorName: item.colorName,
        sizeName: item.sizeName,
        quantity: item.quantity,
        minimum: min,
      });
    }
  }
  return violations;
}
