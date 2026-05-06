import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateOrderShippedHtml,
  generateOrderShippedText,
  getOrderShippedSubject,
} from '@/lib/emails/order-shipped';
import { logAdminActivity, type AdminAuditActor } from '@/lib/admin-audit';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  awaiting_purchasing: 'Awaiting Purchasing',
  ordered: 'Ordered',
  in_production: 'In Production',
  partially_shipped: 'Partially Shipped',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const VALID_STATUSES = ['pending', 'confirmed', 'awaiting_purchasing', 'ordered', 'in_production', 'partially_shipped', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  awaiting_purchasing: 1,
  ordered: 2,
  in_production: 3,
  partially_shipped: 3.5,
  shipped: 4,
  delivered: 5,
  cancelled: 99,
};

const CARRIER_TRACKING_URLS: Record<string, string> = {
  ups: 'https://www.ups.com/track?tracknum=',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  dhl: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
};

function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendShippedEmail(
  order: any,
  trackingNumber: string,
  carrierName: string,
  userId: string,
  serviceSupabase: ReturnType<typeof getServiceSupabase>,
): Promise<{ sent: boolean; error?: string; skippedReason?: string }> {
  const trackingUrl = CARRIER_TRACKING_URLS[carrierName.toLowerCase()]
    ? `${CARRIER_TRACKING_URLS[carrierName.toLowerCase()]}${trackingNumber}`
    : undefined;

  const customerEmail = order.customer_email;

  if (!customerEmail) {
    console.error(`[order-shipped-email] Order ${order.order_number} has no customer_email — skipping`);
    return { sent: false, skippedReason: 'No customer email on order' };
  }

  try {
    const resend = getResend();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.items as any[]) || [];

    const emailProps = {
      orderNumber: order.order_number,
      customerName: order.customer_name || 'Customer',
      carrier: carrierName,
      trackingNumber,
      trackingUrl,
      items: items.map((item: Record<string, unknown>) => ({
        name: `${item.brandName || ''} ${item.styleName || item.productName || ''}`.trim() || 'Item',
        color: (item.colorName as string) || '',
        quantity: (item.quantity as number) || 1,
      })),
      shippingAddress: order.shipping_address as {
        firstName?: string;
        lastName?: string;
        address1?: string;
        address?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        zip?: string;
      } | null,
    };

    const { data: emailData, error: sendErr } = await resend.emails.send({
      from: 'Garment Decor <noreply@garmentdecor.com>',
      to: customerEmail,
      subject: getOrderShippedSubject(order.order_number),
      html: generateOrderShippedHtml(emailProps),
      text: generateOrderShippedText(emailProps),
    });

    if (sendErr) {
      console.error(`[order-shipped-email] Resend API error for ${order.order_number}:`, sendErr);

      await serviceSupabase.from('order_activities').insert({
        order_id: order.id,
        user_id: userId,
        activity_type: 'email_failed',
        details: {
          email_type: 'order_shipped',
          recipient: customerEmail,
          error: sendErr.message || 'Unknown Resend error',
          tracking_number: trackingNumber,
          carrier: carrierName,
        },
      });

      return { sent: false, error: sendErr.message || 'Email delivery failed' };
    }

    console.log(`[order-shipped-email] Sent to ${customerEmail} for ${order.order_number} (id: ${emailData?.id})`);

    await serviceSupabase.from('order_activities').insert({
      order_id: order.id,
      user_id: userId,
      activity_type: 'email_sent',
      details: {
        email_type: 'order_shipped',
        email_id: emailData?.id,
        subject: getOrderShippedSubject(order.order_number),
        recipient: customerEmail,
        tracking_number: trackingNumber,
        carrier: carrierName,
      },
    });

    return { sent: true };
  } catch (emailError) {
    console.error(`[order-shipped-email] Exception for ${order.order_number}:`, emailError);
    return {
      sent: false,
      error: emailError instanceof Error ? emailError.message : 'Unexpected email error',
    };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { status, tracking_number, carrier, actual_shipping_cost, shipment_id, resend_shipped_email } = body;

  const serviceSupabase = getServiceSupabase();

  const { data: order, error: fetchError } = await serviceSupabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (resend_shipped_email) {
    try {
      if (!order.tracking_number) {
        return NextResponse.json({ error: 'Order has no tracking number' }, { status: 400 });
      }
      const emailStatus = await sendShippedEmail(
        order,
        order.tracking_number,
        order.carrier || 'other',
        user.id,
        serviceSupabase,
      );
      await logAdminActivity(request, {
        action: 'order.shipped_email_resent',
        resourceType: 'order',
        resourceId: order.order_number ?? params.id,
        summary: 'resent the shipped notification email for an order',
        actor: {
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role as 'admin' | 'sales_rep',
        },
      });
      return NextResponse.json({ order, emailStatus });
    } catch (resendError) {
      console.error('[resend-shipped-email] Unhandled error:', resendError);
      return NextResponse.json(
        { error: resendError instanceof Error ? resendError.message : 'Failed to resend email' },
        { status: 500 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  const activities: Array<{ activity_type: string; details: Record<string, unknown> }> = [];

  if (status && status !== order.status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const currentRank = STATUS_ORDER[order.status as OrderStatus] ?? 0;
    const newRank = STATUS_ORDER[status as OrderStatus] ?? 0;

    if (status !== 'cancelled' && newRank <= currentRank) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    if (status === 'shipped' && !tracking_number && !order.tracking_number) {
      return NextResponse.json(
        { error: 'Tracking number is required to mark as shipped' },
        { status: 400 }
      );
    }

    updates.status = status;

    if (status === 'ordered') {
      updates.ordered_at = new Date().toISOString();
    } else if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }

    const statusChangeDetails: Record<string, unknown> = { from: order.status, to: status };
    if (status === 'shipped') {
      statusChangeDetails.tracking_number = tracking_number || order.tracking_number;
      statusChangeDetails.carrier = carrier || order.carrier;
    }
    activities.push({
      activity_type: 'status_change',
      details: statusChangeDetails,
    });
  }

  if (tracking_number) {
    updates.tracking_number = tracking_number;
  }

  if (carrier) {
    updates.carrier = carrier;
  }

  if (actual_shipping_cost !== undefined) {
    const cost = parseFloat(actual_shipping_cost);
    if (isNaN(cost) || cost < 0) {
      return NextResponse.json({ error: 'Invalid shipping cost' }, { status: 400 });
    }
    updates.actual_shipping_cost = cost;
  }

  // Handle per-shipment tracking updates
  if (shipment_id && tracking_number) {
    const shipmentUpdates: Record<string, unknown> = {
      tracking_number,
      carrier: carrier || 'other',
      shipped_at: new Date().toISOString(),
    };
    if (actual_shipping_cost !== undefined) {
      const cost = parseFloat(actual_shipping_cost);
      if (!isNaN(cost) && cost >= 0) shipmentUpdates.actual_shipping_cost = cost;
    }

    await serviceSupabase
      .from('order_shipments')
      .update(shipmentUpdates)
      .eq('id', shipment_id);

    // Check if all shipments now have tracking
    const { data: allShipments } = await serviceSupabase
      .from('order_shipments')
      .select('id, tracking_number')
      .eq('order_id', params.id);

    const allShipped = allShipments?.every((s: { tracking_number: string | null }) => s.tracking_number);
    const someShipped = allShipments?.some((s: { tracking_number: string | null }) => s.tracking_number);

    if (allShipped) {
      updates.status = 'shipped';
      updates.shipped_at = new Date().toISOString();
      updates.tracking_number = tracking_number;
      updates.carrier = carrier || 'other';
    } else if (someShipped) {
      updates.status = 'partially_shipped';
    }
  }

  if (Object.keys(updates).length === 0 && !shipment_id) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data: updatedOrder, error: updateError } = Object.keys(updates).length > 0
    ? await serviceSupabase
        .from('orders')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()
    : await serviceSupabase
        .from('orders')
        .select()
        .eq('id', params.id)
        .single();

  if (updateError) {
    console.error('Order update failed:', updateError);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  for (const activity of activities) {
    await serviceSupabase.from('order_activities').insert({
      order_id: params.id,
      user_id: user.id,
      activity_type: activity.activity_type,
      details: activity.details,
    });
  }

  // Audit log: emit human-readable summaries for each high-level change
  const actor: AdminAuditActor = {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role as 'admin' | 'sales_rep',
  };
  for (const activity of activities) {
    if (activity.activity_type === 'status_change') {
      const fromLabel = ORDER_STATUS_LABELS[activity.details.from as string] ?? String(activity.details.from);
      const toLabel = ORDER_STATUS_LABELS[activity.details.to as string] ?? String(activity.details.to);
      await logAdminActivity(request, {
        action: 'order.status_changed',
        resourceType: 'order',
        resourceId: order.order_number ?? params.id,
        summary: `changed an order status from ${fromLabel} to ${toLabel}`,
        actor,
      });
    }
  }
  if (updates.tracking_number || updates.carrier) {
    await logAdminActivity(request, {
      action: 'order.tracking_updated',
      resourceType: 'order',
      resourceId: order.order_number ?? params.id,
      summary: 'updated tracking information on an order',
      actor,
    });
  }
  if (updates.actual_shipping_cost !== undefined) {
    await logAdminActivity(request, {
      action: 'order.shipping_cost_updated',
      resourceType: 'order',
      resourceId: order.order_number ?? params.id,
      summary: 'updated the actual shipping cost on an order',
      actor,
    });
  }

  let emailStatus: { sent: boolean; error?: string; skippedReason?: string } | null = null;

  const finalStatus = (updates.status as string) || order.status;
  const shouldSendEmail = finalStatus === 'shipped' && (tracking_number || order.tracking_number);

  if (shouldSendEmail) {
    emailStatus = await sendShippedEmail(
      updatedOrder,
      tracking_number || order.tracking_number,
      carrier || order.carrier || 'other',
      user.id,
      serviceSupabase,
    );
  }

  return NextResponse.json({ order: updatedOrder, emailStatus });
}
