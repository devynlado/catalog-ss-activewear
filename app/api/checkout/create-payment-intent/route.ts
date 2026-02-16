import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, calculateOrderTotals, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { CartItem, ShippingAddress } from '@/lib/database.types';

interface CreatePaymentIntentRequest {
  items: CartItem[];
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  company?: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: ShippingMethod;
  poNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentIntentRequest = await request.json();
    const { 
      items, 
      customerEmail, 
      customerName, 
      customerPhone,
      company,
      shippingAddress,
      billingAddress,
      shippingMethod = 'economy',
      poNumber 
    } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Calculate totals with shipping method
    const { subtotal, taxAmount, shippingCost, total } = calculateOrderTotals(items, shippingMethod);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Get Supabase client
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Create pending order in database first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user?.id || null,
        customer_email: customerEmail,
        customer_name: customerName || shippingAddress.firstName + ' ' + shippingAddress.lastName,
        customer_phone: customerPhone || shippingAddress.phone,
        company: company || shippingAddress.company,
        items: items,
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total,
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        po_number: poNumber || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Log order creation activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('order_activities').insert({
      order_id: order.id,
      user_id: user?.id || null,
      activity_type: 'created',
      details: {
        order_number: orderNumber,
        item_count: items.length,
        total,
      },
    });

    // Create Stripe PaymentIntent (card only for cleaner checkout)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeCents(total),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        customer_email: customerEmail,
      },
      receipt_email: customerEmail,
      description: `Order ${orderNumber} - ${items.length} item(s)`,
    });

    // Update order with payment intent ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'processing',
      })
      .eq('id', order.id);

    // Log payment processing activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('order_activities').insert({
      order_id: order.id,
      user_id: user?.id || null,
      activity_type: 'payment_processing',
      details: {
        payment_intent_id: paymentIntent.id,
        amount: total,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.order_number,
      total,
      subtotal,
      taxAmount,
      shippingCost,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
