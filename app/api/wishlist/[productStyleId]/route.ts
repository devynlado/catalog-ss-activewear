import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { removeFromWishlist } from '@/lib/wishlist';

// DELETE /api/wishlist/:productStyleId
// Removes a product from the signed-in user's wishlist (idempotent — returns
// 200 even if the row didn't exist).
export async function DELETE(
  _request: Request,
  { params }: { params: { productStyleId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productStyleId = Number(params.productStyleId);
    if (!Number.isFinite(productStyleId) || productStyleId <= 0) {
      return NextResponse.json(
        { error: 'productStyleId must be a positive number' },
        { status: 400 }
      );
    }

    const result = await removeFromWishlist(
      supabase,
      user.id,
      productStyleId
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to remove' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
