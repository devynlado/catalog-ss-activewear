import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, calculateOrderTotals, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { CartItem } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface ShippingInfo {
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface CheckoutRequest {
  items: CartItem[];
  shippingInfo: ShippingInfo;
  shippingMethod: ShippingMethod;
  poNumber?: string;
  orderNotes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, shippingInfo, shippingMethod, poNumber, orderNotes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    if (!shippingInfo || !shippingInfo.email) {
      return NextResponse.json(
        { error: 'Shipping information required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totals = calculateOrderTotals(items, shippingMethod);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity,
      0
    );
    
    // Determine actual shipping cost (free economy over $500)
    const actualShippingCost = shippingMethod === 'economy' && subtotal >= 500 
      ? 0 
      : totals.shippingCost;

    // Calculate total with shipping
    const totalWithShipping = subtotal + actualShippingCost + totals.taxAmount;

    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (request.headers.get('origin') ?? 'http://localhost:3000');

    // Build shipping address object for database
    const shippingAddressData = {
      firstName: shippingInfo.firstName,
      lastName: shippingInfo.lastName,
      company: shippingInfo.company || null,
      address: shippingInfo.address,
      apartment: shippingInfo.apartment || null,
      city: shippingInfo.city,
      state: shippingInfo.state,
      zipCode: shippingInfo.zipCode,
      phone: shippingInfo.phone,
    };

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
        customer_email: shippingInfo.email,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_phone: shippingInfo.phone,
        company: shippingInfo.company || null,
        items: items.map(item => ({
          type: 'product',
          sku: item.sku,
          styleId: item.styleId,
          styleName: item.styleName,
          brandName: item.brandName,
          colorName: item.colorName,
          colorCode: item.colorCode,
          sizeName: item.sizeName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountedPrice: item.discountedPrice,
          imageUrl: item.imageUrl,
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        shipping_cost: actualShippingCost,
        tax_amount: totals.taxAmount,
        total: Math.round(totalWithShipping * 100) / 100,
        shipping_address: shippingAddressData,
        billing_address: shippingAddressData,
        shipping_method: shippingMethod,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        notes: orderNotes || null,
        metadata: {
          order_type: 'cart',
          po_number: poNumber || null,
        },
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
        order_type: 'cart',
        item_count: items.length,
        total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
        total: totalWithShipping,
      },
    });

    // Build item summary for Stripe metadata
    const itemSummary = items.slice(0, 3).map(item => 
      `${item.brandName} ${item.styleName} (${item.quantity})`
    ).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');

    // Create Stripe PaymentIntent with comprehensive metadata for webhook
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeCents(totalWithShipping),
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        order_type: 'cart',
        customer_email: shippingInfo.email,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_phone: shippingInfo.phone,
        customer_company: shippingInfo.company || '',
        shipping_method: shippingMethod,
        item_count: items.length.toString(),
        total_pieces: items.reduce((sum, item) => sum + item.quantity, 0).toString(),
        po_number: poNumber || '',
        notes: orderNotes || '',
      },
      receipt_email: shippingInfo.email,
      description: `Order ${orderNumber} - ${itemSummary}`,
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
        amount: totalWithShipping,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber,
      pricing: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: totals.taxAmount,
        shipping: actualShippingCost,
        total: Math.round(totalWithShipping * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
