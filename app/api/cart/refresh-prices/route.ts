import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/lib/database.types';
import { prepareCartItemsForPricing, fetchSkuStockBySku, type SkuStockInfo } from '@/lib/cart-pricing-server';
import { fetchEffectiveMinimumsBySku } from '@/lib/product-rules';

export interface StockWarning {
  sku: string;
  colorName: string;
  sizeName: string;
  styleName: string;
  requestedQty: number;
  availableQty: number;
}

/**
 * POST /api/cart/refresh-prices
 * Re-aligns persisted cart lines with current DB list prices and tier rules
 * (and derived Google discount from stored snapshots).
 * Also checks cached stock levels and returns warnings for OOS items.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawItems = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ items: [], stockWarnings: [] }, { status: 200 });
    }

    const cartItems = rawItems as CartItem[];
    const skus = cartItems.map((i) => i.sku);
    const [pricedItems, stockMap, minBySku] = await Promise.all([
      prepareCartItemsForPricing(cartItems),
      fetchSkuStockBySku(skus),
      fetchEffectiveMinimumsBySku(skus),
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

    const stockWarnings: StockWarning[] = [];
    for (const item of cartItems) {
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

    return NextResponse.json({ items, stockWarnings });
  } catch (e) {
    console.error('[cart/refresh-prices]', e);
    return NextResponse.json(
      { error: 'Failed to refresh cart prices' },
      { status: 500 },
    );
  }
}
