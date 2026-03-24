import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerProfile } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import { toStripeCents } from '@/lib/stripe-utils';
import {
  generateRefundConfirmationHtml,
  generateRefundConfirmationText,
  getRefundConfirmationSubject,
  type RefundConfirmationProps,
} from '@/lib/emails/refund-confirmation';
import { Resend } from 'resend';

function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type OrderItem = {
  type?: string;
  sku?: string;
  styleId?: number;
  styleName?: string;
  brandName?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  discountedPrice?: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const { profile } = await getServerProfile();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();

  const body = await request.json().catch(() => ({}));
  const fullOrder = body.fullOrder === true;
  const lineIndices = Array.isArray(body.lineIndices) ? body.lineIndices as number[] : [];
  const reason = typeof body.reason === 'string' ? body.reason : undefined;
  const note = typeof body.note === 'string' ? body.note : undefined;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, total, stripe_charge_id, payment_status, items')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (!order.stripe_charge_id) {
    return NextResponse.json(
      { error: 'Order has no charge to refund' },
      { status: 400 }
    );
  }

  if (order.payment_status === 'refunded') {
    return NextResponse.json(
      { error: 'Order is already fully refunded' },
      { status: 400 }
    );
  }

  const { data: refundPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('type', 'refund')
    .eq('status', 'succeeded');

  const totalRefunded = (refundPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const maxRefundable = Number(order.total) - totalRefunded;

  if (maxRefundable <= 0) {
    return NextResponse.json(
      { error: 'No amount left to refund' },
      { status: 400 }
    );
  }

  let refundAmount: number;

  if (fullOrder) {
    refundAmount = Math.round(maxRefundable * 100) / 100;
  } else if (lineIndices.length > 0) {
    const items = (order.items as OrderItem[]) ?? [];
    refundAmount = 0;
    for (const i of lineIndices) {
      if (i >= 0 && i < items.length) {
        const item = items[i];
        const price = item.discountedPrice ?? item.unitPrice ?? 0;
        const qty = item.quantity ?? 1;
        refundAmount += price * qty;
      }
    }
    refundAmount = Math.round(refundAmount * 100) / 100;
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Selected items total $0' },
        { status: 400 }
      );
    }
    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { error: 'Refund amount exceeds remaining refundable amount' },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Provide fullOrder: true or lineIndices array' },
      { status: 400 }
    );
  }

  const amountCents = toStripeCents(refundAmount);
  if (amountCents < 1) {
    return NextResponse.json(
      { error: 'Refund amount too small' },
      { status: 400 }
    );
  }

  try {
    const refund = await stripe.refunds.create({
      charge: order.stripe_charge_id,
      amount: amountCents,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        admin_id: profile.id ?? '',
      },
    });

    // Do not insert into payments or order_activities here. The Stripe charge.refunded
    // webhook will record the refund once; recording here too would double-count.
    const isFullRefund = fullOrder && Math.abs(refundAmount - maxRefundable) < 0.01;

    await supabase
      .from('orders')
      .update({
        payment_status: isFullRefund ? 'refunded' : 'paid',
      })
      .eq('id', orderId);

    const emailProps: RefundConfirmationProps = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      refundAmount,
      isFullRefund,
    };

    const resend = getResend();
    const { error: refundEmailError } = await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: order.customer_email,
      subject: getRefundConfirmationSubject(order.order_number, refundAmount),
      html: generateRefundConfirmationHtml(emailProps),
      text: generateRefundConfirmationText(emailProps),
    });
    if (!refundEmailError) {
      await supabase.from('order_activities').insert({
        order_id: orderId,
        user_id: profile.id ?? null,
        activity_type: 'email_sent',
        details: {
          email_type: 'refund_confirmation',
          subject: getRefundConfirmationSubject(order.order_number, refundAmount),
          recipient: order.customer_email,
          refund_amount: refundAmount,
        },
      });
    }
  } catch (err) {
    console.error('Refund failed:', err);
    const message = err instanceof Error ? err.message : 'Refund failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    refundAmount,
    fullRefund: fullOrder,
  });
}
