import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * GET /api/reviews?styleId=X&page=1&sort=newest|highest|lowest
 * Public endpoint: returns paginated approved reviews + aggregate for a product
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const styleId = searchParams.get('styleId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const sort = searchParams.get('sort') || 'newest';
  const pageSize = 10;

  if (!styleId) {
    return NextResponse.json({ error: 'styleId is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const styleIdNum = parseInt(styleId, 10);

  // Fetch aggregate distribution in parallel with reviews
  const [reviewsResult, distributionResult] = await Promise.all([
    (() => {
      let query = supabase
        .from('reviews')
        .select('id, customer_name, rating, title, body, photos, verified_purchase, admin_response, created_at', { count: 'exact' })
        .eq('style_id', styleIdNum)
        .eq('status', 'approved');

      if (sort === 'highest') {
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
      } else if (sort === 'lowest') {
        query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      return query;
    })(),
    supabase
      .from('reviews')
      .select('rating')
      .eq('style_id', styleIdNum)
      .eq('status', 'approved'),
  ]);

  if (reviewsResult.error) {
    console.error('[Reviews API] Query error:', reviewsResult.error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  // Build star distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const allRatings = distributionResult.data || [];
  for (const r of allRatings) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  }

  const reviewCount = allRatings.length;
  const avgRating = reviewCount > 0
    ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 100) / 100
    : 0;

  const reviews = (reviewsResult.data || []).map((r) => {
    const photos = (r.photos as string[]) || [];
    return {
      id: r.id,
      customerName: r.customer_name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      reviewerAvatar: photos[0] || null,
      verifiedPurchase: r.verified_purchase,
      adminResponse: r.admin_response,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json({
    reviews,
    aggregate: { avgRating, reviewCount, distribution },
    page,
    pageSize,
    totalPages: Math.ceil((reviewsResult.count || 0) / pageSize),
  });
}
