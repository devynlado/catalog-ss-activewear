import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrderSession } from '@/lib/order-session';
import { Resend } from 'resend';
import {
  generateReviewRewardHtml,
  generateReviewRewardText,
  getReviewRewardSubject,
} from '@/lib/emails/review-reward';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * GET /api/orders/reviews
 * Returns: (a) products eligible for review, (b) past reviews by this customer
 */
export async function GET() {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Fetch delivered orders (7+ days ago) with their items
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [ordersResult, reviewsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, items, delivered_at, status')
      .ilike('customer_email', session.email)
      .eq('status', 'delivered')
      .lte('delivered_at', sevenDaysAgo.toISOString())
      .order('delivered_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, style_id, rating, title, body, photos, status, reward_coupon_id, admin_response, created_at, updated_at')
      .ilike('customer_email', session.email)
      .order('created_at', { ascending: false }),
  ]);

  if (ordersResult.error) {
    console.error('[Orders Reviews] Orders query error:', ordersResult.error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  // Get coupon codes for past reviews that have reward coupons
  const reviewsWithCoupons = (reviewsResult.data || []).filter(r => r.reward_coupon_id);
  let couponMap: Record<string, string> = {};
  if (reviewsWithCoupons.length > 0) {
    const couponIds = reviewsWithCoupons.map(r => r.reward_coupon_id!);
    const { data: coupons } = await supabase
      .from('coupons')
      .select('id, code')
      .in('id', couponIds);
    if (coupons) {
      couponMap = Object.fromEntries(coupons.map(c => [c.id, c.code]));
    }
  }

  // Set of style_ids already reviewed
  const reviewedStyleIds = new Set(
    (reviewsResult.data || []).map(r => r.style_id)
  );

  // Extract unique products from delivered orders that haven't been reviewed yet
  type EligibleProduct = {
    styleId: number;
    styleName: string;
    brandName: string;
    title: string;
    colorName: string;
    imageUrl: string;
    orderId: string;
    orderNumber: string;
    deliveredAt: string;
  };
  const eligible: EligibleProduct[] = [];
  const seenStyleIds = new Set<number>();

  for (const order of ordersResult.data || []) {
    const items = order.items as Array<{
      styleId?: number;
      styleName?: string;
      brandName?: string;
      productTitle?: string;
      colorName?: string;
      imageUrl?: string;
    }>;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item.styleId || seenStyleIds.has(item.styleId) || reviewedStyleIds.has(item.styleId)) continue;
      seenStyleIds.add(item.styleId);
      eligible.push({
        styleId: item.styleId,
        styleName: item.styleName || '',
        brandName: item.brandName || '',
        title: item.productTitle || item.styleName || '',
        colorName: item.colorName || '',
        imageUrl: item.imageUrl || '',
        orderId: order.id,
        orderNumber: order.order_number,
        deliveredAt: order.delivered_at || '',
      });
    }
  }

  // Fetch product info for reviewed products (for display)
  const reviewedIds = (reviewsResult.data || []).map(r => r.style_id);
  let productInfoMap: Record<number, { styleName: string; brandName: string; primaryImageUrl: string }> = {};
  if (reviewedIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('style_id, style_name, brand_name, primary_image_url')
      .in('style_id', reviewedIds);
    if (products) {
      productInfoMap = Object.fromEntries(
        products.map(p => [p.style_id, {
          styleName: p.style_name,
          brandName: p.brand_name,
          primaryImageUrl: p.primary_image_url || '',
        }])
      );
    }
  }

  const pastReviews = (reviewsResult.data || []).map(r => {
    const productInfo = productInfoMap[r.style_id];
    return {
      id: r.id,
      styleId: r.style_id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      couponCode: r.reward_coupon_id ? couponMap[r.reward_coupon_id] || null : null,
      adminResponse: r.admin_response,
      createdAt: r.created_at,
      productName: productInfo ? `${productInfo.brandName} ${productInfo.styleName}` : `Product #${r.style_id}`,
      productImage: productInfo?.primaryImageUrl || '',
    };
  });

  return NextResponse.json({ eligible, pastReviews });
}

/**
 * POST /api/orders/reviews
 * Submit a new review with hybrid moderation + coupon generation
 */
export async function POST(request: NextRequest) {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { styleId, orderId, rating, title, reviewBody, avatarUrl } = body as {
    styleId: number;
    orderId: string;
    rating: number;
    title?: string;
    reviewBody: string;
    avatarUrl?: string;
  };

  if (!styleId || !orderId || !rating || !reviewBody) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  if (reviewBody.length < 10) {
    return NextResponse.json({ error: 'Review must be at least 10 characters' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify the customer actually purchased this product in this order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, items, customer_email, customer_name, status, delivered_at')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.customer_email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'Order must be delivered before reviewing' }, { status: 400 });
  }

  // Check product is in the order
  const items = order.items as Array<{ styleId?: number }>;
  const hasProduct = Array.isArray(items) && items.some(item => item.styleId === styleId);
  if (!hasProduct) {
    return NextResponse.json({ error: 'Product not found in this order' }, { status: 400 });
  }

  // Check for existing review
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('customer_email', session.email.toLowerCase())
    .eq('style_id', styleId)
    .single();

  if (existingReview) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
  }

  // Hybrid moderation: auto-approve 4-5 stars, hold 1-3
  const status = rating >= 4 ? 'approved' : 'pending';

  // Generate unique coupon for the reviewer
  const couponCode = `REVIEW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      code: couponCode,
      description: `10% off reward for product review (style ${styleId})`,
      discount_type: 'percent_cart',
      amount: 10,
      usage_limit: 1,
      usage_limit_per_customer: 1,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, code')
    .single();

  if (couponError) {
    console.error('[Reviews] Coupon creation error:', couponError);
  }

  // Insert the review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      style_id: styleId,
      order_id: orderId,
      customer_email: session.email.toLowerCase(),
      customer_name: order.customer_name || session.customer.name,
      rating,
      title: title || null,
      body: reviewBody,
      photos: avatarUrl ? [avatarUrl] : [],
      status,
      reward_coupon_id: coupon?.id || null,
    })
    .select('id, status')
    .single();

  if (reviewError) {
    console.error('[Reviews] Insert error:', reviewError);
    if (reviewError.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }

  // If auto-approved, update product aggregates
  if (status === 'approved') {
    const { error: rpcError } = await supabase.rpc('recalculate_review_aggregates', { p_style_id: styleId });
    if (rpcError) {
      await updateAggregatesManually(supabase, styleId);
    }
  }

  // Send reward coupon email (async, don't block response)
  if (coupon) {
    sendRewardEmail(session.email, session.customer.name || order.customer_name, coupon.code).catch(err => {
      console.error('[Reviews] Reward email error:', err);
    });
  }

  return NextResponse.json({
    success: true,
    reviewId: review?.id,
    status,
    couponCode: coupon?.code || null,
    message: status === 'approved'
      ? 'Thank you! Your review is now live.'
      : 'Thank you! Your review is being processed and will appear soon.',
  });
}

async function updateAggregatesManually(supabase: ReturnType<typeof getSupabase>, styleId: number) {
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('style_id', styleId)
    .eq('status', 'approved');

  if (data && data.length > 0) {
    const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
    await supabase
      .from('products')
      .update({ avg_rating: Math.round(avg * 100) / 100, review_count: data.length })
      .eq('style_id', styleId);
  }
}

async function sendRewardEmail(email: string, name: string | null, couponCode: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  await resend.emails.send({
    from: 'Garment Decor <noreply@garmentdecor.com>',
    to: email,
    subject: getReviewRewardSubject(),
    html: generateReviewRewardHtml({ customerName: name, couponCode, expiresInDays: 90 }),
    text: generateReviewRewardText({ customerName: name, couponCode, expiresInDays: 90 }),
  });
}
