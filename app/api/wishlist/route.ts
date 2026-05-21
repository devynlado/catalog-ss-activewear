import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  addToWishlist,
  listWishlist,
} from '@/lib/wishlist';

// GET /api/wishlist
// Returns the signed-in user's wishlist as { items: number[] } (style_ids,
// newest first). Anonymous callers get 200 + empty list — anonymous wishlists
// live entirely in localStorage on the client.
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ items: [] satisfies number[] });
    }

    const items = await listWishlist(supabase, user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist
// Body: { productStyleId: number }
// Adds the product to the signed-in user's wishlist (idempotent).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      productStyleId?: unknown;
    };
    const raw = body.productStyleId;
    const productStyleId =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
        ? Number(raw)
        : NaN;

    if (!Number.isFinite(productStyleId) || productStyleId <= 0) {
      return NextResponse.json(
        { error: 'productStyleId is required and must be a positive number' },
        { status: 400 }
      );
    }

    const result = await addToWishlist(supabase, user.id, productStyleId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to add' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
