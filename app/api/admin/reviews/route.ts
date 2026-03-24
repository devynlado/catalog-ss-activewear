import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/reviews?status=pending|approved|rejected&page=1
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceSupabase = getServiceSupabase();

  // Verify admin/sales role
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = serviceSupabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: reviews, count, error } = await query;

  if (error) {
    console.error('[Admin Reviews] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  // Fetch product info for each unique style_id
  const styleIds = [...new Set((reviews || []).map(r => r.style_id))];
  let productMap: Record<number, { style_name: string; brand_name: string; primary_image_url: string | null }> = {};
  if (styleIds.length > 0) {
    const { data: products } = await serviceSupabase
      .from('products')
      .select('style_id, style_name, brand_name, primary_image_url')
      .in('style_id', styleIds);
    if (products) {
      productMap = Object.fromEntries(products.map(p => [p.style_id, p]));
    }
  }

  const enriched = (reviews || []).map(r => {
    const photos = (r.photos as string[]) || [];
    return {
      ...r,
      reviewerAvatar: photos[0] || null,
      product: productMap[r.style_id] || null,
    };
  });

  return NextResponse.json({
    reviews: enriched,
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}
