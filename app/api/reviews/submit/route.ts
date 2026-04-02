import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
 * POST /api/reviews/submit
 * Token-authenticated review submission — used from the direct /reviews/write page.
 * Validates the review_invites token instead of requiring an order session.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, styleId, orderId, rating, title, reviewBody, avatarUrl } = body as {
    token: string;
    styleId: number;
    orderId: string;
    rating: number;
    title?: string;
    reviewBody: string;
    avatarUrl?: string;
  };

  if (!token) {
    return NextResponse.json({ error: 'Missing review token' }, { status: 401 });
  }
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

  // Validate the invite token and get the associated customer email / order
  const { data: invite, error: inviteError } = await supabase
    .from('review_invites')
    .select('id, order_id, customer_email, customer_name')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired review link' }, { status: 401 });
  }

  // The orderId from the request must match the invite
  if (invite.order_id !== orderId) {
    return NextResponse.json({ error: 'Order mismatch' }, { status: 403 });
  }

  const customerEmail = invite.customer_email.toLowerCase().trim();

  // Fetch the order to verify product existence
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, items, customer_email, customer_name, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Verify the invite email matches the order email
  if (order.customer_email.toLowerCase().trim() !== customerEmail) {
    return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
  }

  // Check product is in the order
  const items = order.items as Array<{ styleId?: number }>;
  const hasProduct = Array.isArray(items) && items.some(item => item.styleId === styleId);
  if (!hasProduct) {
    return NextResponse.json({ error: 'Product not found in this order' }, { status: 400 });
  }

  // Check for existing review (by email + styleId)
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .ilike('customer_email', customerEmail)
    .eq('style_id', styleId)
    .single();

  if (existingReview) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
  }

  // Hybrid moderation: auto-approve 4-5 stars, hold 1-3
  const status = rating >= 4 ? 'approved' : 'pending';

  // Generate unique coupon
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
    console.error('[Reviews/Submit] Coupon creation error:', couponError);
  }

  const customerName = invite.customer_name || order.customer_name || null;

  // Insert the review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      style_id: styleId,
      order_id: orderId,
      customer_email: customerEmail,
      customer_name: customerName,
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
    console.error('[Reviews/Submit] Insert error:', reviewError);
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

  // Send reward coupon email asynchronously
  if (coupon) {
    sendRewardEmail(customerEmail, customerName, coupon.code).catch(err => {
      console.error('[Reviews/Submit] Reward email error:', err);
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
    from: 'Garment Decor <orders@garmentdecor.com>',
    to: email,
    subject: getReviewRewardSubject(),
    html: generateReviewRewardHtml({ customerName: name, couponCode, expiresInDays: 90 }),
    text: generateReviewRewardText({ customerName: name, couponCode, expiresInDays: 90 }),
  });
}
