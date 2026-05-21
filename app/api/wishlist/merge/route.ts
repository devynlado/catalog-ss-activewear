import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  listWishlist,
  mergeIntoWishlist,
  normalizeStyleIds,
} from '@/lib/wishlist';

// POST /api/wishlist/merge
// Body: { items: number[] }
// Used at login: the anonymous localStorage wishlist is POSTed here, the
// server upserts it into customer_wishlists, then returns the unified list.
// Existing server-side items are preserved (set-union semantics).
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
      items?: unknown;
    };
    const ids = normalizeStyleIds(body.items);

    const mergeResult = await mergeIntoWishlist(supabase, user.id, ids);
    if (!mergeResult.ok) {
      return NextResponse.json(
        { error: mergeResult.error ?? 'Failed to merge' },
        { status: 500 }
      );
    }

    const items = await listWishlist(supabase, user.id);
    return NextResponse.json({
      ok: true,
      merged: mergeResult.merged,
      items,
    });
  } catch (error) {
    console.error('Wishlist merge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
