import { NextRequest, NextResponse } from 'next/server';
import { getProductsByStyleIds } from '@/lib/product-cache';
import { normalizeStyleIds } from '@/lib/wishlist';

// POST /api/wishlist/products
// Body: { ids: number[] }
// Returns: { products: Product[], orphans: number[] }
//
// Public endpoint — used by the /wishlist page (and any future surface) to
// hydrate a list of style_ids into full Product objects in a single
// round-trip. The page itself reads the style_ids from the client wishlist
// store (Zustand+persist), so the canonical source of truth is the client.
// We just turn ids → products here.
//
// `orphans` are style_ids the client asked for that no longer exist in the
// catalog (deleted products). The /wishlist UI uses this to keep the row
// visible in a greyed-out "no longer available" state while leaving the
// item removable from the user's list.
//
// Cap at 200 to match the wishlist's per-user max.
const MAX_IDS = 200;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    const ids = normalizeStyleIds(body.ids).slice(0, MAX_IDS);

    if (ids.length === 0) {
      return NextResponse.json({ products: [], orphans: [] });
    }

    const products = await getProductsByStyleIds(ids);
    const foundSet = new Set(products.map((p) => p.styleId));
    const orphans = ids.filter((id) => !foundSet.has(id));

    return NextResponse.json({ products, orphans });
  } catch (error) {
    console.error('Wishlist products fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
