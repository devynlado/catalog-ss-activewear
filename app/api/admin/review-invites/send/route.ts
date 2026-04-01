import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateReviewInviteHtml,
  generateReviewInviteText,
  getReviewInviteSubject,
  type ReviewInviteProps,
} from '@/lib/emails/review-invite';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/review-invites/send
 * Manually send a review invitation for a specific order (even if outside the normal 7-30 day window).
 * Body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // Fetch the order
  const { data: order, error: orderErr } = await serviceSupabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, items, status')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'delivered') {
    return NextResponse.json(
      { error: `Order is "${order.status}", not "delivered". Review invites should only be sent for delivered orders.` },
      { status: 400 }
    );
  }

  // Check if invite already exists
  const { data: existingInvite } = await serviceSupabase
    .from('review_invites')
    .select('id, email_status')
    .eq('order_id', orderId)
    .single();

  if (existingInvite) {
    return NextResponse.json(
      { error: 'An invite already exists for this order. Use the resend button instead.', inviteId: existingInvite.id },
      { status: 409 }
    );
  }

  // Create invite
  const { data: invite, error: inviteErr } = await serviceSupabase
    .from('review_invites')
    .insert({
      order_id: order.id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
    })
    .select('token, id')
    .single();

  if (inviteErr) {
    console.error('[Manual Review Invite] Insert error:', inviteErr);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  const items = order.items as Array<{
    brandName?: string;
    styleName?: string;
    productTitle?: string;
    imageUrl?: string;
  }>;
  const products = Array.isArray(items)
    ? items.map(item => ({
        name: item.productTitle || `${item.brandName || ''} ${item.styleName || ''}`.trim() || 'Product',
        imageUrl: item.imageUrl,
      }))
    : [];

  const emailProps: ReviewInviteProps = {
    customerName: order.customer_name,
    orderNumber: order.order_number,
    token: invite.token,
    products,
  };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data: sendData, error: sendErr } = await resend.emails.send({
    from: 'Garment Decor <orders@garmentdecor.com>',
    to: order.customer_email,
    subject: getReviewInviteSubject(order.customer_name),
    html: generateReviewInviteHtml(emailProps),
    text: generateReviewInviteText(emailProps),
  });

  if (sendErr) {
    await serviceSupabase
      .from('review_invites')
      .update({ email_status: 'failed', error_message: sendErr.message } as Record<string, unknown>)
      .eq('id', invite.id);

    return NextResponse.json(
      { error: 'Invite created but email failed to send', detail: sendErr.message, inviteId: invite.id },
      { status: 500 }
    );
  }

  await serviceSupabase
    .from('review_invites')
    .update({
      email_status: 'sent',
      resend_message_id: sendData?.id || null,
    } as Record<string, unknown>)
    .eq('id', invite.id);

  return NextResponse.json({
    success: true,
    message: `Review invite sent to ${order.customer_email}`,
    inviteId: invite.id,
  });
}
