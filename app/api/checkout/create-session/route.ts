import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { CartItem } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateCoupon, calculateOrderTotalsWithCoupon } from '@/lib/coupon-utils';

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
  idempotencyKey?: string;
  couponCode?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, shippingInfo, shippingMethod, poNumber, orderNotes, idempotencyKey, couponCode } = body;

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

    const subtotal = items.reduce(
      (sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity,
      0
    );
    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    let discountAmount = 0;
    let actualShippingCost: number;
    let taxAmount: number;
    let totalWithShipping: number;
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;

    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (couponCode && couponCode.trim()) {
      const supabaseService = createServerSupabaseClient();
      const result = await validateCoupon(supabaseService, {
        code: couponCode.trim(),
        subtotal: roundedSubtotal,
        context: 'cart',
        customerId: user?.id ?? undefined,
        customerEmail: user?.email ?? shippingInfo.email ?? undefined,
      });
      if (result.valid) {
        couponId = result.coupon.id;
        appliedCouponCode = result.coupon.code;
        discountAmount = result.discountAmount;
        const withCoupon = calculateOrderTotalsWithCoupon(
          roundedSubtotal,
          shippingMethod,
          { discountAmount: result.discountAmount, freeShipping: result.freeShipping }
        );
        actualShippingCost = withCoupon.shippingCost;
        taxAmount = withCoupon.taxAmount;
        totalWithShipping = withCoupon.total;
      } else {
        return NextResponse.json(
          { error: result.message || 'Coupon is not valid' },
          { status: 400 }
        );
      }
    } else {
      const withCoupon = calculateOrderTotalsWithCoupon(roundedSubtotal, shippingMethod, null);
      actualShippingCost = withCoupon.shippingCost;
      taxAmount = withCoupon.taxAmount;
      totalWithShipping = withCoupon.total;
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

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

    const supabase = authClient;

    // Build item summary for Stripe metadata
    const itemSummary = items.slice(0, 3).map(item => 
      `${item.brandName} ${item.styleName} (${item.quantity})`
    ).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');

    // Create order in DB and Stripe PaymentIntent in parallel
    // Both are independent at this point — the order gets the PI id updated after
    const orderInsertPromise = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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
        subtotal: roundedSubtotal,
        shipping_cost: actualShippingCost,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total: Math.round(totalWithShipping * 100) / 100,
        coupon_id: couponId,
        coupon_code: appliedCouponCode,
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

    const paymentIntentPromise = stripe.paymentIntents.create(
      {
        amount: toStripeCents(totalWithShipping),
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
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
        description: `Order ${orderNumber} - ${itemSummary}`,
      },
      // Use idempotency key to prevent duplicate charges on retry
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    // Wait for both to complete
    const [orderResult, paymentIntent] = await Promise.all([
      orderInsertPromise,
      paymentIntentPromise,
    ]);

    const { data: order, error: orderError } = orderResult;

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Now run the follow-up writes in parallel
    // These are: update order with PI id, patch PI metadata with order_id, log activities
    await Promise.all([
      // Update order with payment intent ID
      (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('orders')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          payment_status: 'processing',
        })
        .eq('id', order.id),
      // Patch order_id into PI metadata so the webhook can link payment to order
      stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { order_id: order.id },
      }),
      // Log order creation activity
      (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('order_activities')
        .insert({
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
        }),
      // Log payment processing activity
      (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('order_activities')
        .insert({
          order_id: order.id,
          user_id: user?.id || null,
          activity_type: 'payment_processing',
          details: {
            payment_intent_id: paymentIntent.id,
            amount: totalWithShipping,
          },
        }),
    ]);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber,
      pricing: {
        subtotal: roundedSubtotal,
        tax: taxAmount,
        shipping: actualShippingCost,
        discount: discountAmount,
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
