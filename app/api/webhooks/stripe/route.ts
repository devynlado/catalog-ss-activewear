import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, fromStripeCents } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generatePackageOrderConfirmationHtml,
  generatePackageOrderConfirmationText,
  getPackageOrderConfirmationSubject,
} from '@/lib/emails/package-order-confirmation';
import {
  generatePackageOrderNotificationHtml,
  generatePackageOrderNotificationText,
  getPackageOrderNotificationSubject,
} from '@/lib/emails/package-order-notification';
import {
  PackageOrderEmailProps,
  DecorationMethod,
} from '@/lib/emails/components';
import { syncOrderToMedusa } from '@/lib/medusa';

// Lazy initialization for Resend
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

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

  // Retrieve the charge with balance_transaction to get exact Stripe fee
  let stripeFee: number | null = null;
  const chargeId = paymentIntent.latest_charge as string;
  if (chargeId) {
    try {
      const charge = await stripe.charges.retrieve(chargeId, {
        expand: ['balance_transaction'],
      });
      const bt = charge.balance_transaction;
      if (bt && typeof bt === 'object' && 'fee' in bt) {
        stripeFee = bt.fee / 100;
      }
    } catch (feeErr) {
      console.error('Failed to retrieve Stripe fee:', feeErr);
    }
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'awaiting_purchasing',
      stripe_charge_id: chargeId,
      paid_at: new Date().toISOString(),
      ...(stripeFee !== null ? { stripe_fee: stripeFee } : {}),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Error updating order:', updateError);
    throw updateError;
  }

  // Increment coupon used_count if order used a coupon
  const { data: orderWithCoupon } = await supabase
    .from('orders')
    .select('coupon_id')
    .eq('id', orderId)
    .single();
  if (orderWithCoupon?.coupon_id) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('id', orderWithCoupon.coupon_id)
      .single();
    if (coupon) {
      await supabase
        .from('coupons')
        .update({ used_count: (coupon.used_count ?? 0) + 1 })
        .eq('id', orderWithCoupon.coupon_id);
    }
  }

  // Log payment to payments table
  await supabase.from('payments').insert({
    order_id: orderId,
    amount: fromStripeCents(paymentIntent.amount),
    currency: paymentIntent.currency,
    type: 'charge',
    status: 'succeeded',
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: chargeId,
    metadata: {
      order_number: orderNumber,
      ...(stripeFee !== null ? { stripe_fee: stripeFee } : {}),
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

  // Log awaiting_purchasing activity
  await supabase.from('order_activities').insert({
    order_id: orderId,
    activity_type: 'awaiting_purchasing',
    details: {
      order_number: orderNumber,
    },
  });

  // Send confirmation emails based on order type
  const orderType = paymentIntent.metadata?.order_type;
  
  if (orderType === 'package') {
    // Handle package order emails
    await sendPackageOrderEmails(supabase, orderId, orderNumber || '', paymentIntent);
  } else {
    // Default order confirmation email (non-blocking)
    try {
      const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email;
      if (customerEmail) {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentIntentId: paymentIntent.id }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the webhook for email errors
    }
  }

  // Mark checkout lead as converted (if one exists for this email)
  const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email;
  if (customerEmail) {
    await supabase
      .from('checkout_leads')
      .update({
        status: 'converted',
        converted_order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq('email', customerEmail.toLowerCase().trim())
      .eq('status', 'new');
  }

  // Sync order to Medusa for order management (fire-and-forget)
  try {
    const { data: orderForSync } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, customer_name, customer_phone, company, items, subtotal, shipping_cost, tax_amount, total, shipping_address, billing_address, payment_status, metadata')
      .eq('id', orderId)
      .single();
    if (orderForSync) {
      syncOrderToMedusa(orderForSync as Parameters<typeof syncOrderToMedusa>[0]).catch((err) =>
        console.error('[Medusa] Sync failed after payment:', err)
      );
    }
  } catch (syncErr) {
    console.error('[Medusa] Failed to fetch order for sync:', syncErr);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPackageOrderEmails(
  supabase: SupabaseClient<any>,
  orderId: string,
  orderNumber: string,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Failed to fetch order for email:', error);
      return;
    }

    const metadata = paymentIntent.metadata;
    
    // Extract order items (package orders store items as array)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItems = order.items as any[];
    const item = orderItems[0] || {};
    
    // Extract shipping address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shippingAddress = order.shipping_address as any;

    const resend = getResend();
    const fromEmail = 'Garment Decor <noreply@garmentdecor.com>';

    // Build email props with new schema
    const totalQuantity = parseInt(metadata.total_quantity) || item.totalQuantity || 0;
    
    const emailProps: PackageOrderEmailProps = {
      // Order basics
      orderNumber,
      customerName: metadata.customer_name || order.customer_name || `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      email: metadata.customer_email || order.customer_email || '',
      
      // Package details from metadata/order
      packageType: metadata.package_type || item.packageType || 'embroidered-caps',
      packageDisplayName: metadata.product_name || item.productName || 'Custom Embroidered Caps',
      productName: metadata.product_style || item.productStyle || 'Richardson 112',
      productUnit: metadata.product_unit || item.productUnit || 'caps',
      decorationMethod: (metadata.decoration_method || item.decorationMethod || 'embroidery') as DecorationMethod,
      
      // Items array
      items: item.colors?.map((c: { colorName: string; quantity: number; sizeBreakdown?: Record<string, number> }) => ({
        colorName: c.colorName,
        quantity: c.quantity,
        sizeBreakdown: c.sizeBreakdown,
      })) || [{ colorName: 'Various', quantity: totalQuantity }],
      
      // Decoration details
      decorationDetails: {
        locations: item.embroideryLocations || item.printLocations || ['front'],
        colors: item.printColors,
        stitchCount: item.stitchCount,
      },
      
      // Pricing
      subtotal: order.subtotal || 0,
      tax: order.tax_amount || 0,
      shipping: order.shipping_cost || 0,
      total: order.total || 0,
      pricePerUnit: item.pricePerUnit || (order.subtotal / (totalQuantity || 1)),
      
      // Shipping
      shippingAddress: {
        street: shippingAddress.address || shippingAddress.street || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zip: shippingAddress.zipCode || shippingAddress.zip || '',
      },
      
      // Artwork
      logoUploaded: !!(metadata.logo_url),
      logoUrl: metadata.logo_url || undefined,
      
      // Optional
      notes: metadata.notes || order.notes || undefined,
      phone: metadata.customer_phone || order.customer_phone || shippingAddress.phone,
      company: metadata.customer_company || order.company || shippingAddress.company,
      paymentIntentId: paymentIntent.id,
      createdAt: new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    };

    // Send customer confirmation email
    if (emailProps.email) {
      const { error: customerEmailError } = await resend.emails.send({
        from: fromEmail,
        to: emailProps.email,
        subject: getPackageOrderConfirmationSubject(orderNumber, emailProps.packageDisplayName),
        html: generatePackageOrderConfirmationHtml(emailProps),
        text: generatePackageOrderConfirmationText(emailProps),
      });

      if (customerEmailError) {
        console.error('Failed to send customer confirmation email:', customerEmailError);
      } else {
        console.log(`Customer confirmation email sent to ${emailProps.email}`);
      }
    }

    // Send internal notification email
    const salesEmail = process.env.SALES_NOTIFICATION_EMAIL || 'orders@garmentdecor.com';
    const { error: salesEmailError } = await resend.emails.send({
      from: fromEmail,
      to: salesEmail,
      subject: getPackageOrderNotificationSubject(orderNumber, emailProps.total, emailProps.packageDisplayName),
      html: generatePackageOrderNotificationHtml(emailProps),
      text: generatePackageOrderNotificationText(emailProps),
    });

    if (salesEmailError) {
      console.error('Failed to send sales notification email:', salesEmailError);
    } else {
      console.log(`Sales notification email sent to ${salesEmail}`);
    }

    // Log activity for email sent
    await supabase.from('order_activities').insert({
      order_id: orderId,
      activity_type: 'email_sent',
      details: {
        email_type: 'package_order_confirmation',
        recipient: emailProps.email,
      },
    });

  } catch (emailError) {
    console.error('Failed to send package order emails:', emailError);
    // Don't throw - we don't want to fail the webhook for email errors
  }
}
