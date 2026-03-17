import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateCouponCampaignHtml,
  generateCouponCampaignText,
  getCouponCampaignSubject,
  type CouponCampaignProps,
} from '@/lib/emails/coupon-campaign';

export const maxDuration = 60;

const CAMPAIGN_NAME = '30day_retention';
const BATCH_LIMIT = 50;
const EXPIRES_IN_DAYS = 14;

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.SYNC_API_KEY;
  if (!expectedKey) {
    console.error('[Coupon Email] SYNC_API_KEY not configured');
    return false;
  }
  return apiKey === expectedKey;
}

/**
 * Fetch the coupon details from the coupons table so we can display
 * the correct discount label (e.g. "10% off", "$15 off") in the email.
 */
async function getCouponDetails(supabase: ReturnType<typeof getServiceSupabase>, code: string) {
  const { data } = await supabase
    .from('coupons')
    .select('code, discount_type, amount')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (!data) return null;

  let discountLabel: string;
  if (data.discount_type === 'percent_cart') {
    const pct = Number(data.amount);
    discountLabel = `${pct % 1 === 0 ? pct.toFixed(0) : pct}% off`;
  } else if (data.discount_type === 'fixed_cart') {
    discountLabel = `$${Number(data.amount).toFixed(0)} off`;
  } else {
    discountLabel = 'free shipping on';
  }

  return { code: data.code as string, discountLabel };
}

/**
 * POST /api/cron/coupon-email
 *
 * Called daily by GitHub Actions. Finds customers whose earliest paid
 * order was 28-32 days ago and who haven't received this campaign email,
 * then sends them a coupon and records the send.
 */
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const couponCode = process.env.RETENTION_COUPON_CODE;
  if (!couponCode) {
    console.error('[Coupon Email] RETENTION_COUPON_CODE env var not set');
    return NextResponse.json(
      { error: 'RETENTION_COUPON_CODE not configured' },
      { status: 500 }
    );
  }

  const supabase = getServiceSupabase();
  const resend = getResend();

  // Look up coupon to get discount label for the email
  const coupon = await getCouponDetails(supabase, couponCode);
  if (!coupon) {
    console.error(`[Coupon Email] Coupon "${couponCode}" not found in database`);
    return NextResponse.json(
      { error: `Coupon "${couponCode}" not found` },
      { status: 500 }
    );
  }

  // Find eligible customers:
  //  - Have at least one paid order between 28 and 32 days ago
  //  - Have NOT already been sent this campaign email
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 32);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() - 28);

  const { data: eligible, error: queryErr } = await supabase
    .rpc('get_coupon_email_eligible', {
      p_campaign: CAMPAIGN_NAME,
      p_window_start: windowStart.toISOString(),
      p_window_end: windowEnd.toISOString(),
      p_limit: BATCH_LIMIT,
    });

  // Fallback: if the RPC doesn't exist yet, use a raw query approach
  let customers: Array<{
    customer_email: string;
    customer_name: string | null;
    order_id: string;
    order_number: string;
  }>;

  if (queryErr || !eligible) {
    console.warn('[Coupon Email] RPC not available, using direct query');
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, customer_email, customer_name, order_number, paid_at')
      .eq('payment_status', 'paid')
      .gte('paid_at', windowStart.toISOString())
      .lte('paid_at', windowEnd.toISOString())
      .order('paid_at', { ascending: true })
      .limit(200);

    if (ordersErr || !orders) {
      console.error('[Coupon Email] Failed to query orders:', ordersErr);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    // Fetch already-sent emails for this campaign
    const { data: alreadySent } = await supabase
      .from('coupon_email_sends')
      .select('customer_email')
      .eq('campaign', CAMPAIGN_NAME);

    const sentSet = new Set((alreadySent || []).map((r: { customer_email: string }) => r.customer_email.toLowerCase()));

    // De-duplicate by email, keep earliest order, exclude already-sent
    const seen = new Map<string, typeof orders[0]>();
    for (const order of orders) {
      const email = order.customer_email.toLowerCase();
      if (sentSet.has(email)) continue;
      if (!seen.has(email)) {
        seen.set(email, order);
      }
    }

    customers = Array.from(seen.values())
      .slice(0, BATCH_LIMIT)
      .map((o) => ({
        customer_email: o.customer_email,
        customer_name: o.customer_name,
        order_id: o.id,
        order_number: o.order_number,
      }));
  } else {
    customers = eligible as typeof customers;
  }

  console.log(`[Coupon Email] Found ${customers.length} eligible customers`);

  if (customers.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible customers' });
  }

  let sent = 0;
  let failed = 0;
  const results: Array<{ email: string; status: 'sent' | 'skipped' | 'failed'; error?: string }> = [];

  for (const customer of customers) {
    try {
      const emailProps: CouponCampaignProps = {
        customerName: customer.customer_name,
        customerEmail: customer.customer_email,
        orderNumber: customer.order_number,
        couponCode: coupon.code,
        discountLabel: coupon.discountLabel,
        expiresInDays: EXPIRES_IN_DAYS,
      };

      const { data: sendResult, error: sendErr } = await resend.emails.send({
        from: 'Garment Decor <noreply@garmentdecor.com>',
        to: customer.customer_email,
        subject: getCouponCampaignSubject(coupon.discountLabel),
        html: generateCouponCampaignHtml(emailProps),
        text: generateCouponCampaignText(emailProps),
      });

      if (sendErr) {
        console.error(`[Coupon Email] Resend error for ${customer.customer_email}:`, sendErr);
        results.push({ email: customer.customer_email, status: 'failed', error: sendErr.message });
        failed++;
        continue;
      }

      // Record the send (UNIQUE constraint prevents duplicates)
      const { error: insertErr } = await supabase
        .from('coupon_email_sends')
        .insert({
          customer_email: customer.customer_email,
          customer_name: customer.customer_name,
          order_id: customer.order_id,
          order_number: customer.order_number,
          coupon_code: coupon.code,
          campaign: CAMPAIGN_NAME,
          resend_id: sendResult?.id || null,
        });

      if (insertErr) {
        // UNIQUE violation means already sent — not a real error
        if (insertErr.code === '23505') {
          console.log(`[Coupon Email] Already sent to ${customer.customer_email}, skipping`);
          results.push({ email: customer.customer_email, status: 'skipped' });
          continue;
        }
        console.error(`[Coupon Email] Insert error for ${customer.customer_email}:`, insertErr);
      }

      sent++;
      results.push({ email: customer.customer_email, status: 'sent' });
      console.log(`[Coupon Email] Sent to ${customer.customer_email} (${customer.order_number})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Coupon Email] Error for ${customer.customer_email}:`, message);
      results.push({ email: customer.customer_email, status: 'failed', error: message });
      failed++;
    }
  }

  console.log(`[Coupon Email] Complete: ${sent} sent, ${failed} failed, ${results.filter(r => r.status === 'skipped').length} skipped`);

  return NextResponse.json({
    sent,
    failed,
    skipped: results.filter(r => r.status === 'skipped').length,
    total: customers.length,
    results,
  });
}
