import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, fromStripeCents } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSucceeded(supabase: SupabaseClient<any>, paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  const orderNumber = paymentIntent.metadata?.order_number;
  
  if (!orderId) {
    console.error('No order_id in payment intent metadata');
    return;
  }

  // Idempotency check - don't process if already paid
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, payment_status')
    .eq('id', orderId)
    .single();

  if (existingOrder?.payment_status === 'paid') {
    console.log(`Order ${orderId} already marked as paid, skipping`);
    return;
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_charge_id: paymentIntent.latest_charge as string,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Error updating order:', updateError);
    throw updateError;
  }

  // Log payment to payments table
  await supabase.from('payments').insert({
    order_id: orderId,
    amount: fromStripeCents(paymentIntent.amount),
    currency: paymentIntent.currency,
    type: 'charge',
    status: 'succeeded',
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: paymentIntent.latest_charge as string,
    metadata: {
      order_number: orderNumber,
    },
  });

  // Log activity
  await supabase.from('order_activities').insert({
    order_id: orderId,
    activity_type: 'payment_received',
    details: {
      amount: fromStripeCents(paymentIntent.amount),
      payment_intent_id: paymentIntent.id,
    },
  });

  // Log confirmed activity
  await supabase.from('order_activities').insert({
    order_id: orderId,
    activity_type: 'confirmed',
    details: {
      order_number: orderNumber,
    },
  });

  // Send confirmation email (non-blocking)
  try {
    const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email;
    if (customerEmail) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/order-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
    }
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail the webhook for email errors
  }

  console.log(`Payment succeeded for order ${orderNumber} (${orderId})`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(supabase: SupabaseClient<any>, paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  
  if (!orderId) {
    console.error('No order_id in payment intent metadata');
    return;
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
    })
    .eq('id', orderId);

  // Log failed payment
  const lastError = paymentIntent.last_payment_error;
  await supabase.from('payments').insert({
    order_id: orderId,
    amount: fromStripeCents(paymentIntent.amount),
    currency: paymentIntent.currency,
    type: 'charge',
    status: 'failed',
    stripe_payment_intent_id: paymentIntent.id,
    failure_code: lastError?.code || null,
    failure_message: lastError?.message || null,
  });

  // Log activity
  await supabase.from('order_activities').insert({
    order_id: orderId,
    activity_type: 'payment_failed',
    details: {
      error_code: lastError?.code,
      error_message: lastError?.message,
    },
  });

  console.log(`Payment failed for order ${orderId}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleChargeRefunded(supabase: SupabaseClient<any>, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  
  if (!paymentIntentId) {
    console.error('No payment_intent in charge');
    return;
  }

  // Find order by payment intent ID
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!order) {
    console.error('Order not found for payment intent:', paymentIntentId);
    return;
  }

  // Calculate refund amount
  const refundAmount = fromStripeCents(charge.amount_refunded);
  const isFullRefund = charge.refunded;

  // Update order status
  await supabase
    .from('orders')
    .update({
      payment_status: isFullRefund ? 'refunded' : 'paid', // partial refund stays paid
    })
    .eq('id', order.id);

  // Log refund
  await supabase.from('payments').insert({
    order_id: order.id,
    amount: refundAmount,
    currency: charge.currency,
    type: 'refund',
    status: 'succeeded',
    stripe_charge_id: charge.id,
    metadata: {
      full_refund: isFullRefund,
    },
  });

  // Log activity
  await supabase.from('order_activities').insert({
    order_id: order.id,
    activity_type: 'refunded',
    details: {
      amount: refundAmount,
      full_refund: isFullRefund,
    },
  });

  console.log(`Refund processed for order ${order.order_number}`);
}
