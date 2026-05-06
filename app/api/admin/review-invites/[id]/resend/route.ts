import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logAdminActivity } from '@/lib/admin-audit';
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
 * POST /api/admin/review-invites/[id]/resend
 * Manually resend a review invitation email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceSupabase = getServiceSupabase();

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const auditActor = {
    id: profile.id as string,
    full_name: (profile.full_name as string | null) ?? null,
    role: profile.role as 'admin' | 'sales_rep',
  };

  // Fetch the invite
  const { data: invite, error: inviteErr } = await serviceSupabase
    .from('review_invites')
    .select('*')
    .eq('id', id)
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  // Fetch the order for product info
  const { data: order } = await serviceSupabase
    .from('orders')
    .select('id, order_number, customer_name, items')
    .eq('id', invite.order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Associated order not found' }, { status: 404 });
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
    customerName: invite.customer_name,
    orderNumber: order.order_number,
    token: invite.token,
    products,
  };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data: sendData, error: sendErr } = await resend.emails.send({
    from: 'Garment Decor <orders@garmentdecor.com>',
    to: invite.customer_email,
    subject: getReviewInviteSubject(invite.customer_name),
    html: generateReviewInviteHtml(emailProps),
    text: generateReviewInviteText(emailProps),
  });

  if (sendErr) {
    await serviceSupabase
      .from('review_invites')
      .update({
        email_status: 'failed',
        error_message: sendErr.message,
        last_resent_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', id);

    return NextResponse.json(
      { error: 'Failed to send email', detail: sendErr.message },
      { status: 500 }
    );
  }

  await serviceSupabase
    .from('review_invites')
    .update({
      email_status: 'sent',
      resend_message_id: sendData?.id || null,
      error_message: null,
      last_resent_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', id);

  await logAdminActivity(request, {
    action: 'review_invite.resent',
    resourceType: 'review_invite',
    resourceId: id,
    summary: 'resent a review invitation email',
    actor: auditActor,
  });

  return NextResponse.json({
    success: true,
    message: `Review invite resent to ${invite.customer_email}`,
  });
}
