import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// POST: Track a product view
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only track for logged-in users
    if (!user) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const body = await request.json();
    const { product_slug, product_data } = body;

    if (!product_slug) {
      return NextResponse.json(
        { error: 'product_slug is required' },
        { status: 400 }
      );
    }

    // Upsert the view (update viewed_at if exists)
    const { error } = await supabase
      .from('recently_viewed_products')
      .upsert(
        {
          user_id: user.id,
          product_slug,
          product_data: product_data || {},
          source: 'viewed',
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,product_slug',
          // Don't downgrade 'quoted' to 'viewed'
          ignoreDuplicates: false,
        }
      );

    if (error) {
      // If it's a conflict with 'quoted' source, that's fine - don't downgrade
      console.error('Error tracking view:', error);
    }

    return NextResponse.json({ success: true, tracked: true });

  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ success: true, tracked: false });
  }
}
