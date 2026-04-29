import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/lib/database.types';
import { prepareCartItemsForPricing, fetchSkuStockBySku, type SkuStockInfo } from '@/lib/cart-pricing-server';
import { fetchEffectiveMinimumsBySku } from '@/lib/product-rules';
import { createServerSupabaseClient } from '@/lib/supabase';

export interface StockWarning {
  sku: string;
  colorName: string;
  sizeName: string;
  styleName: string;
  requestedQty: number;
  availableQty: number;
}

export interface UnavailableLine {
  sku: string;
  styleId: number;
  colorName: string;
  sizeName: string;
  styleName: string;
  reason: 'manually_hidden' | 'discontinued';
}

/**
 * Look up parent-product visibility for the styles referenced by the cart and
 * return the styleIds that are NOT customer-purchasable. We treat a row as
 * unavailable when the parent product has either:
 *   - manually_hidden = true (admin toggled hide via /admin/products), or
 *   - is_active = false      (auto-discontinued by the SS sync)
 *
 * Returns a map of styleId → reason. styleIds not in the map are purchasable.
 */
async function fetchUnavailableStyleIds(
  styleIds: number[],
): Promise<Map<number, UnavailableLine['reason']>> {
  const out = new Map<number, UnavailableLine['reason']>();
  const unique = [...new Set(styleIds.filter((id): id is number => Number.isFinite(id)))];
  if (unique.length === 0) return out;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('style_id, is_active, manually_hidden')
    .in('style_id', unique);

  if (error || !data) {
    // Fail-open: don't strand carts on a transient DB error. Stock + price
    // checks below still run.
    return out;
  }

  for (const row of data as Array<{
    style_id: number;
    is_active: boolean;
    manually_hidden: boolean;
  }>) {
    if (row.manually_hidden) {
      out.set(row.style_id, 'manually_hidden');
    } else if (row.is_active === false) {
      out.set(row.style_id, 'discontinued');
    }
  }
  return out;
}

/**
 * POST /api/cart/refresh-prices
 * Re-aligns persisted cart lines with current DB list prices and tier rules
 * (and derived Google discount from stored snapshots).
 * Also checks cached stock levels and parent-product visibility, returning
 * `stockWarnings` for low-stock items and `unavailableLines` for items whose
 * parent product is hidden/discontinued.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawItems = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { items: [], stockWarnings: [], unavailableLines: [] },
        { status: 200 },
      );
    }

    const cartItems = rawItems as CartItem[];
    const skus = cartItems.map((i) => i.sku);
    const styleIds = cartItems.map((i) => i.styleId);
    const [pricedItems, stockMap, minBySku, unavailableByStyle] = await Promise.all([
      prepareCartItemsForPricing(cartItems),
      fetchSkuStockBySku(skus),
      fetchEffectiveMinimumsBySku(skus),
      fetchUnavailableStyleIds(styleIds),
    ]);

    // Re-snapshot the latest minOrderQuantity onto each cart item so the cart
    // UI immediately reflects admin edits made since the cart was last saved.
    // IMPORTANT: only overwrite when the lookup actually returned a row for
    // this SKU. If it didn't (transient DB error, SKU not in our DB yet, etc.)
    // we keep whatever snapshot the item already had so we never silently
    // demote a known minimum back to null.
    const items = pricedItems.map((item) => {
      if (minBySku.has(item.sku)) {
        return { ...item, minOrderQuantity: minBySku.get(item.sku) ?? null };
      }
      return item;
    });

    const unavailableLines: UnavailableLine[] = [];
    const stockWarnings: StockWarning[] = [];

    for (const item of cartItems) {
      // Visibility takes priority over stock — a hidden product shouldn't
      // also surface as a low-stock warning, since the message would be
      // misleading.
      const reason = unavailableByStyle.get(item.styleId);
      if (reason) {
        unavailableLines.push({
          sku: item.sku,
          styleId: item.styleId,
          colorName: item.colorName,
          sizeName: item.sizeName,
          styleName: item.styleName,
          reason,
        });
        continue;
      }

      const stock = stockMap.get(item.sku);
      if (!stock || stock.availability === 'out_of_stock' || stock.qty < item.quantity) {
        stockWarnings.push({
          sku: item.sku,
          colorName: item.colorName,
          sizeName: item.sizeName,
          styleName: item.styleName,
          requestedQty: item.quantity,
          availableQty: stock?.qty ?? 0,
        });
      }
    }

    return NextResponse.json({ items, stockWarnings, unavailableLines });
  } catch (e) {
    console.error('[cart/refresh-prices]', e);
    return NextResponse.json(
      { error: 'Failed to refresh cart prices' },
      { status: 500 },
    );
  }
}
