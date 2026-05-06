import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateOrderTrackingNotificationHtml,
  generateOrderTrackingNotificationText,
  getOrderTrackingNotificationSubject,
} from '@/lib/emails/order-tracking-notification';
import { logAdminActivity } from '@/lib/admin-audit';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const ACTIVE_STATUSES = ['awaiting_purchasing', 'ordered', 'in_production', 'confirmed', 'partially_shipped'];
const BATCH_SIZE = 10;

/**
 * One-time admin endpoint to send order tracking notification emails
 * to customers with orders in active stages.
 *
 * POST /api/admin/send-tracking-notification
 * Body: { dryRun?: boolean }
 *
 * dryRun=true returns the list of orders that would receive emails without sending.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceSupabase = getServiceSupabase();

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun === true;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.garmentdecor.com';

  const { data: orders, error: fetchError } = await serviceSupabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, status, access_token')
    .in('status', ACTIVE_STATUSES)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch orders', details: fetchError.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: 'No active orders found', sent: 0 });
  }

  // Check which orders already received this email (via order_activities)
  const orderIds = orders.map(o => o.id);
  const { data: alreadySent } = await serviceSupabase
    .from('order_activities')
    .select('order_id')
    .in('order_id', orderIds)
    .eq('activity_type', 'email_sent')
    .eq('details->>email_type', 'tracking_portal_notification');

  const sentOrderIds = new Set((alreadySent || []).map(a => a.order_id));
  const eligible = orders.filter(o => !sentOrderIds.has(o.id));

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalActive: orders.length,
      alreadyNotified: sentOrderIds.size,
      eligible: eligible.length,
      orders: eligible.map(o => ({
        orderNumber: o.order_number,
        email: o.customer_email,
        status: o.status,
        hasToken: !!o.access_token,
      })),
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (order) => {
      try {
        // Ensure access_token exists
        let accessToken = order.access_token;
        if (!accessToken) {
          accessToken = crypto.randomUUID();
          await serviceSupabase
            .from('orders')
            .update({ access_token: accessToken })
            .eq('id', order.id);
        }

        const trackingUrl = `${siteUrl}/orders?token=${accessToken}`;
        const props = {
          customerName: order.customer_name || order.customer_email,
          orderNumber: order.order_number,
          trackingUrl,
        };

        const { error: sendError } = await resend.emails.send({
          from: 'Garment Decor <orders@garmentdecor.com>',
          to: order.customer_email,
          subject: getOrderTrackingNotificationSubject(),
          html: generateOrderTrackingNotificationHtml(props),
          text: generateOrderTrackingNotificationText(props),
        });

        if (sendError) {
          failed++;
          errors.push(`${order.order_number}: ${sendError.message}`);
          return;
        }

        await serviceSupabase.from('order_activities').insert({
          order_id: order.id,
          activity_type: 'email_sent',
          details: {
            email_type: 'tracking_portal_notification',
            subject: getOrderTrackingNotificationSubject(),
            recipient: order.customer_email,
          },
        });

        sent++;
      } catch (err) {
        failed++;
        errors.push(`${order.order_number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }));

    // Small delay between batches to respect Resend rate limits
    if (i + BATCH_SIZE < eligible.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (sent > 0) {
    await logAdminActivity(request, {
      action: 'order.tracking_notification_sent',
      resourceType: 'order_batch',
      resourceId: null,
      summary: `sent tracking-portal notification emails to ${sent} customer${sent !== 1 ? 's' : ''}`,
      actor: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role as 'admin' | 'sales_rep',
      },
    });
  }

  return NextResponse.json({
    message: `Tracking notification sent to ${sent} customer${sent !== 1 ? 's' : ''}`,
    sent,
    failed,
    skippedAlreadySent: sentOrderIds.size,
    errors: errors.length > 0 ? errors : undefined,
  });
}
