import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateReviewInviteHtml,
  generateReviewInviteText,
  getReviewInviteSubject,
  type ReviewInviteProps,
} from '@/lib/emails/review-invite';

export const maxDuration = 60;

const BATCH_LIMIT = 50;

function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.SYNC_API_KEY;
  if (expectedKey && apiKey === expectedKey) return true;

  console.error('[Review Invite] Auth failed — neither CRON_SECRET nor SYNC_API_KEY matched');
  return false;
}

async function handleReviewInvite(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 30);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() - 7);

  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, items, delivered_at')
    .eq('status', 'delivered')
    .gte('delivered_at', windowStart.toISOString())
    .lte('delivered_at', windowEnd.toISOString())
    .order('delivered_at', { ascending: true })
    .limit(200);

  if (ordersErr || !orders) {
    console.error('[Review Invite] Failed to query orders:', ordersErr);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  const orderIds = orders.map(o => o.id);
  const sentOrderIds = new Set<string>();

  if (orderIds.length > 0) {
    const { data: existingInvites } = await supabase
      .from('review_invites')
      .select('order_id')
      .in('order_id', orderIds);

    for (const inv of existingInvites || []) {
      sentOrderIds.add(inv.order_id);
    }
  }

  const eligible = orders.filter(o => !sentOrderIds.has(o.id)).slice(0, BATCH_LIMIT);

  console.log(`[Review Invite] Found ${eligible.length} eligible orders (${orders.length} total delivered in window)`);

  if (eligible.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible orders' });
  }

  let sent = 0;
  let failed = 0;
  const results: Array<{ email: string; status: 'sent' | 'skipped' | 'failed'; error?: string }> = [];

  for (const order of eligible) {
    try {
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

      const { data: invite, error: inviteErr } = await supabase
        .from('review_invites')
        .insert({
          order_id: order.id,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
        })
        .select('token')
        .single();

      if (inviteErr) {
        if (inviteErr.code === '23505') {
          results.push({ email: order.customer_email, status: 'skipped' });
          continue;
        }
        throw inviteErr;
      }

      const emailProps: ReviewInviteProps = {
        customerName: order.customer_name,
        orderNumber: order.order_number,
        token: invite.token,
        products,
      };

      const { error: sendErr } = await resend.emails.send({
        from: 'Garment Decor <noreply@garmentdecor.com>',
        to: order.customer_email,
        subject: getReviewInviteSubject(),
        html: generateReviewInviteHtml(emailProps),
        text: generateReviewInviteText(emailProps),
      });

      if (sendErr) {
        console.error(`[Review Invite] Resend error for ${order.customer_email}:`, sendErr);
        results.push({ email: order.customer_email, status: 'failed', error: sendErr.message });
        failed++;
        continue;
      }

      sent++;
      results.push({ email: order.customer_email, status: 'sent' });
      console.log(`[Review Invite] Sent to ${order.customer_email} (${order.order_number})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Review Invite] Error for ${order.customer_email}:`, message);
      results.push({ email: order.customer_email, status: 'failed', error: message });
      failed++;
    }
  }

  console.log(`[Review Invite] Complete: ${sent} sent, ${failed} failed`);

  return NextResponse.json({
    sent,
    failed,
    skipped: results.filter(r => r.status === 'skipped').length,
    total: eligible.length,
    results,
  });
}

export async function GET(request: NextRequest) {
  return handleReviewInvite(request);
}

export async function POST(request: NextRequest) {
  return handleReviewInvite(request);
}
