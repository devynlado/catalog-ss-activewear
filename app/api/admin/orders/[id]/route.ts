import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateOrderShippedHtml,
  generateOrderShippedText,
  getOrderShippedSubject,
} from '@/lib/emails/order-shipped';

const VALID_STATUSES = ['pending', 'confirmed', 'awaiting_purchasing', 'ordered', 'in_production', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  awaiting_purchasing: 1,
  ordered: 2,
  in_production: 3,
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
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
  const { status, tracking_number, carrier, actual_shipping_cost } = body;

  const serviceSupabase = getServiceSupabase();

  const { data: order, error: fetchError } = await serviceSupabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data: updatedOrder, error: updateError } = await serviceSupabase
    .from('orders')
    .update(updates)
    .eq('id', params.id)
    .select()
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

  if (status === 'shipped' && (tracking_number || order.tracking_number)) {
    const finalTrackingNumber = tracking_number || order.tracking_number;
    const finalCarrier = carrier || order.carrier || 'other';
    const trackingUrl = CARRIER_TRACKING_URLS[finalCarrier.toLowerCase()]
      ? `${CARRIER_TRACKING_URLS[finalCarrier.toLowerCase()]}${finalTrackingNumber}`
      : undefined;

    try {
      const resend = getResend();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (updatedOrder.items as any[]) || [];

      const emailProps = {
        orderNumber: updatedOrder.order_number,
        customerName: updatedOrder.customer_name || 'Customer',
        carrier: finalCarrier,
        trackingNumber: finalTrackingNumber,
        trackingUrl,
        items: items.map((item: Record<string, unknown>) => ({
          name: `${item.brandName || ''} ${item.styleName || item.productName || ''}`.trim() || 'Item',
          color: (item.colorName as string) || '',
          quantity: (item.quantity as number) || 1,
        })),
        shippingAddress: updatedOrder.shipping_address as {
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

      const customerEmail = updatedOrder.customer_email;
      if (customerEmail) {
        const { error: sendErr } = await resend.emails.send({
          from: 'Garment Decor <noreply@garmentdecor.com>',
          to: customerEmail,
          subject: getOrderShippedSubject(updatedOrder.order_number),
          html: generateOrderShippedHtml(emailProps),
          text: generateOrderShippedText(emailProps),
        });
        if (!sendErr) {
          await serviceSupabase.from('order_activities').insert({
            order_id: params.id,
            user_id: user.id,
            activity_type: 'email_sent',
            details: {
              email_type: 'order_shipped',
              subject: getOrderShippedSubject(updatedOrder.order_number),
              recipient: customerEmail,
              tracking_number: finalTrackingNumber,
              carrier: finalCarrier,
            },
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send shipped email:', emailError);
    }
  }

  return NextResponse.json({ order: updatedOrder });
}
