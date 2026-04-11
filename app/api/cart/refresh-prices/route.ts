import { NextRequest, NextResponse } from 'next/server';
import type { CartItem } from '@/lib/database.types';
import { prepareCartItemsForPricing } from '@/lib/cart-pricing-server';

/**
 * POST /api/cart/refresh-prices
 * Re-aligns persisted cart lines with current DB list prices and tier rules
 * (and derived Google discount from stored snapshots).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawItems = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const items = await prepareCartItemsForPricing(rawItems as CartItem[]);
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[cart/refresh-prices]', e);
    return NextResponse.json(
      { error: 'Failed to refresh cart prices' },
      { status: 500 },
    );
  }
}
