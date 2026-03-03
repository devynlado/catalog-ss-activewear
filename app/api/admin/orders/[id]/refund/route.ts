import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerProfile } from '@/lib/supabase-server';
import { stripe, toStripeCents } from '@/lib/stripe';
import { sendRefundConfirmationEmail } from '@/lib/emails/refund-confirmation';

async function requireAdmin() {
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** POST /api/admin/orders/[id]/refund – process full or partial refund */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id: orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  let body: { fullRefund?: boolean; lineItemIndices?: number[]; reason?: string; internalNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, total, stripe_charge_id, payment_status, items')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const chargeId = (order as { stripe_charge_id: string | null }).stripe_charge_id;
  if (!chargeId) {
    return NextResponse.json(
      { error: 'This order has no Stripe charge (e.g. $0 order). Refunds cannot be processed via Stripe.' },
      { status: 400 }
    );
  }

  if ((order as { payment_status: string }).payment_status === 'refunded') {
    return NextResponse.json({ error: 'Order is already fully refunded' }, { status: 400 });
  }

  const { data: refundPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('type', 'refund');

  const totalRefunded = (refundPayments ?? []).reduce((sum, p) => sum + Number((p as { amount: number }).amount), 0);
  const orderTotal = Number((order as { total: number }).total);
  const maxRefundable = Math.round((orderTotal - totalRefunded) * 100) / 100;

  if (maxRefundable <= 0) {
    return NextResponse.json({ error: 'No amount left to refund' }, { status: 400 });
  }

  let refundAmount: number;
  const fullRefund = body.fullRefund === true;

  if (fullRefund) {
    refundAmount = maxRefundable;
  } else if (Array.isArray(body.lineItemIndices) && body.lineItemIndices.length > 0) {
    const items = ((order as { items: Array<Record<string, unknown>> }).items ?? []) as Array<{
      quantity?: number;
      unitPrice?: number;
      discountedPrice?: number;
    }>;
    let sum = 0;
    for (const idx of body.lineItemIndices) {
      if (idx >= 0 && idx < items.length) {
        const qty = Number(items[idx].quantity ?? 0);
        const unit = Number(items[idx].discountedPrice ?? items[idx].unitPrice ?? 0);
        sum += qty * unit;
      }
    }
    refundAmount = Math.round(sum * 100) / 100;
    if (refundAmount <= 0) {
      return NextResponse.json({ error: 'Selected items amount is zero' }, { status: 400 });
    }
    if (refundAmount > maxRefundable) {
      refundAmount = maxRefundable;
    }
  } else {
    return NextResponse.json(
      { error: 'Provide fullRefund: true or lineItemIndices: number[]' },
      { status: 400 }
    );
  }

  const amountCents = toStripeCents(refundAmount);
  if (amountCents < 1) {
    return NextResponse.json({ error: 'Refund amount too small' }, { status: 400 });
  }

  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amountCents,
      reason: 'requested_by_customer',
      metadata: {
        order_id: orderId,
        order_number: (order as { order_number: string }).order_number,
        full_refund: String(fullRefund),
      },
    });

    await (supabase as any).from('payments').insert({
      order_id: orderId,
      amount: refundAmount,
      currency: 'usd',
      type: 'refund',
      status: 'succeeded',
      stripe_charge_id: chargeId,
      stripe_refund_id: refund.id,
      metadata: {
        full_refund: fullRefund,
        reason: body.reason ?? null,
        internal_note: body.internalNote ?? null,
      },
    });

    const isNowFullyRefunded = fullRefund || Math.abs(refundAmount - maxRefundable) < 0.01;
    if (isNowFullyRefunded) {
      await (supabase as any).from('orders').update({ payment_status: 'refunded' }).eq('id', orderId);
    }

    await (supabase as any).from('order_activities').insert({
      order_id: orderId,
      activity_type: 'refunded',
      details: {
        amount: refundAmount,
        full_refund: fullRefund,
        stripe_refund_id: refund.id,
        reason: body.reason ?? null,
      },
    });

    const customerEmail = (order as { customer_email: string }).customer_email;
    const customerName = (order as { customer_name: string | null }).customer_name ?? 'Customer';
    const orderNumber = (order as { order_number: string }).order_number;

    try {
      await sendRefundConfirmationEmail({
        to: customerEmail,
        customerName: customerName,
        orderNumber,
        refundAmount,
        isFullRefund: fullRefund,
      });
    } catch (emailErr) {
      console.error('Refund confirmation email failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      fullRefund: fullRefund,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe refund failed';
    console.error('Refund error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
