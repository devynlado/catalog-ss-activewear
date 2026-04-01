import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { CartItem } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateCoupon, calculateOrderTotalsWithCoupon } from '@/lib/coupon-utils';
import { hasTieredPricing, getEffectiveItemPrice } from '@/lib/tiered-pricing';
import { groupCartByWarehouse, calculateShippingBreakdown } from '@/lib/shipping';
import { placeSSOrder } from '@/lib/ss-activewear-orders';

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

interface DecorationData {
  type: string;
  packageId: string;
  packageName: string;
  pricePerPiece: number;
  setupFee: number;
  totalPrice: number;
  quantity: number;
  artworkFileName?: string;
  artworkUrl?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  shippingInfo: ShippingInfo;
  shippingMethod: ShippingMethod;
  decoration?: DecorationData | null;
  poNumber?: string;
  orderNotes?: string;
  idempotencyKey?: string;
  couponCode?: string | null;
  liveShippingCost?: number | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, shippingInfo, shippingMethod, decoration, poNumber, orderNotes, idempotencyKey, couponCode, liveShippingCost, utm_source, utm_medium, utm_campaign, gclid } = body;

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

    // Apply tiered pricing on the server side (min of volume tier vs Google discount)
    const styleQtyMap = new Map<number, number>();
    for (const item of items) {
      if (hasTieredPricing(item.styleId)) {
        styleQtyMap.set(item.styleId, (styleQtyMap.get(item.styleId) || 0) + item.quantity);
      }
    }
    const subtotal = items.reduce((sum, item) => {
      const totalStyleQty = styleQtyMap.get(item.styleId) ?? 0;
      return sum + getEffectiveItemPrice(item, totalStyleQty) * item.quantity;
    }, 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    // Decoration cost (screen printing, embroidery, etc.)
    const decorationTotal = decoration ? Math.round((decoration.totalPrice ?? 0) * 100) / 100 : 0;

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
          { discountAmount: result.discountAmount, freeShipping: result.freeShipping },
          items,
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
      const withCoupon = calculateOrderTotalsWithCoupon(roundedSubtotal, shippingMethod, null, items);
      actualShippingCost = withCoupon.shippingCost;
      taxAmount = withCoupon.taxAmount;
      totalWithShipping = withCoupon.total;
    }

    // Override shipping cost with live ShipStation rate when provided by the frontend
    if (typeof liveShippingCost === 'number' && liveShippingCost >= 0) {
      const shippingDiff = liveShippingCost - actualShippingCost;
      actualShippingCost = liveShippingCost;
      totalWithShipping = Math.round((totalWithShipping + shippingDiff) * 100) / 100;
    }

    // Add decoration cost to the total (tax is on products only, matching checkout UI)
    if (decorationTotal > 0) {
      totalWithShipping = Math.round((totalWithShipping + decorationTotal) * 100) / 100;
    }

    // Group items by warehouse for shipment records
    const shipmentGroups = groupCartByWarehouse(items);
    const couponFreeShipping = couponCode ? (await (async () => {
      const supabaseService2 = createServerSupabaseClient();
      const r = await validateCoupon(supabaseService2, {
        code: couponCode.trim(),
        subtotal: roundedSubtotal,
        context: 'cart',
      });
      return r.valid ? r.freeShipping : false;
    })()) : false;
    const shippingBreakdown = calculateShippingBreakdown(
      shipmentGroups,
      shippingMethod,
      roundedSubtotal,
      couponFreeShipping,
    );

    // Generate order number
    const orderNumber = generateOrderNumber();
    const roundedTotal = Math.round(totalWithShipping * 100) / 100;

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

    // --- $0 orders (e.g. 100% discount + free shipping): no payment, complete immediately ---
    if (roundedTotal < 0.01) {
      const { data: order, error: orderError } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user?.id || null,
          customer_email: shippingInfo.email,
          customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          customer_phone: shippingInfo.phone,
          company: shippingInfo.company || null,
          items: [
            ...items.map(item => ({
              type: 'product' as const,
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
            ...(decoration ? [{
              type: 'decoration' as const,
              decorationType: decoration.type,
              packageId: decoration.packageId,
              packageName: decoration.packageName,
              quantity: decoration.quantity,
              unitPrice: decoration.pricePerPiece,
              setupFee: decoration.setupFee,
              totalPrice: decorationTotal,
              artworkFileName: decoration.artworkFileName || null,
              artworkUrl: decoration.artworkUrl || null,
            }] : []),
          ],
          subtotal: roundedSubtotal,
          shipping_cost: actualShippingCost,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total: roundedTotal,
          coupon_id: couponId,
          coupon_code: appliedCouponCode,
          shipping_address: shippingAddressData,
          billing_address: shippingAddressData,
          shipping_method: shippingMethod,
          payment_method: 'card',
          payment_status: 'paid',
          status: 'awaiting_purchasing',
          paid_at: new Date().toISOString(),
          access_token: crypto.randomUUID(),
          notes: orderNotes || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          gclid: gclid || null,
          metadata: {
            order_type: 'cart',
            po_number: poNumber || null,
            free_order: true,
          },
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating free order:', orderError);
        return NextResponse.json(
          { error: 'Failed to create order' },
          { status: 500 }
        );
      }

      // Increment coupon used_count
      if (couponId) {
        const svc = createServerSupabaseClient();
        const { data: coupon } = await (svc as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .from('coupons')
          .select('used_count')
          .eq('id', couponId)
          .single();
        if (coupon) {
          await (svc as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .from('coupons')
            .update({ used_count: ((coupon as any).used_count ?? 0) + 1 }) // eslint-disable-line @typescript-eslint/no-explicit-any
            .eq('id', couponId);
        }
      }

      await Promise.all([
        (supabase as any).from('order_activities').insert({ // eslint-disable-line @typescript-eslint/no-explicit-any
          order_id: order.id,
          user_id: user?.id || null,
          activity_type: 'created',
          details: {
            order_number: orderNumber,
            order_type: 'cart',
            item_count: items.length,
            total_pieces: items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
            total: roundedTotal,
            free_order: true,
          },
        }),
        (supabase as any).from('order_activities').insert({ // eslint-disable-line @typescript-eslint/no-explicit-any
          order_id: order.id,
          user_id: user?.id || null,
          activity_type: 'payment_received',
          details: { amount: 0, free_order: true },
        }),
        (supabase as any).from('order_activities').insert({ // eslint-disable-line @typescript-eslint/no-explicit-any
          order_id: order.id,
          activity_type: 'awaiting_purchasing',
          details: { order_number: orderNumber },
        }),
        (supabase as any).from('payments').insert({ // eslint-disable-line @typescript-eslint/no-explicit-any
          order_id: order.id,
          amount: 0,
          currency: 'usd',
          type: 'charge',
          status: 'succeeded',
          metadata: { free_order: true },
        }),
      ]);

      // Auto-place order with SS Activewear (fire-and-forget, non-blocking)
      placeSSOrder(order.id).catch((err) =>
        console.error('[SS Activewear] Auto-order failed for free order:', err)
      );

      return NextResponse.json({
        orderId: order.id,
        orderNumber,
        freeOrder: true,
        pricing: {
          subtotal: roundedSubtotal,
          decoration: decorationTotal,
          tax: taxAmount,
          shipping: actualShippingCost,
          discount: discountAmount,
          total: roundedTotal,
        },
      });
    }

    // Build item summary for Stripe metadata
    const itemSummary = items.slice(0, 3).map(item => 
      `${item.brandName} ${item.styleName} (${item.quantity})`
    ).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');

    // Batch-fetch COGS for all SKUs to snapshot cost at time of purchase
    const supabaseService = createServerSupabaseClient();
    const skus = items.map(i => i.sku);
    const { data: skuCosts } = await supabaseService
      .from('product_skus')
      .select('sku, cogs')
      .in('sku', skus) as { data: { sku: string; cogs: number | null }[] | null };
    const cogsMap: Record<string, number | null> = Object.fromEntries(
      (skuCosts || []).map(s => [s.sku, s.cogs])
    );

    const totalCogs = items.reduce(
      (sum, item) => sum + (cogsMap[item.sku] ?? 0) * item.quantity, 0
    );

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
        items: [
          ...items.map(item => ({
            type: 'product' as const,
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
            cogs: cogsMap[item.sku] ?? null,
          })),
          ...(decoration ? [{
            type: 'decoration' as const,
            decorationType: decoration.type,
            packageId: decoration.packageId,
            packageName: decoration.packageName,
            quantity: decoration.quantity,
            unitPrice: decoration.pricePerPiece,
            setupFee: decoration.setupFee,
            totalPrice: decorationTotal,
            artworkFileName: decoration.artworkFileName || null,
            artworkUrl: decoration.artworkUrl || null,
          }] : []),
        ],
        subtotal: roundedSubtotal,
        shipping_cost: actualShippingCost,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total: roundedTotal,
        total_cogs: Math.round(totalCogs * 100) / 100,
        cogs_source: 'live',
        coupon_id: couponId,
        coupon_code: appliedCouponCode,
        shipping_address: shippingAddressData,
        billing_address: shippingAddressData,
        shipping_method: shippingMethod,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        notes: orderNotes || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        gclid: gclid || null,
        metadata: {
          order_type: 'cart',
          po_number: poNumber || null,
          ...(decorationTotal > 0 ? {
            decoration_type: decoration!.type,
            decoration_package: decoration!.packageName,
            decoration_total: decorationTotal,
            decoration_quantity: decoration!.quantity,
            decoration_price_per_piece: decoration!.pricePerPiece,
            decoration_setup_fee: decoration!.setupFee,
          } : {}),
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
          ...(decorationTotal > 0 ? {
            decoration_type: decoration!.type,
            decoration_package: decoration!.packageName,
            decoration_total: decorationTotal.toFixed(2),
          } : {}),
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

    // Build order_shipments rows
    const shipmentRows = shipmentGroups.map((group, idx) => {
      const breakdownEntry = shippingBreakdown.shipments.find(
        s => s.warehouse === group.warehouse
      );
      return {
        order_id: order.id,
        shipment_index: idx,
        warehouse: group.warehouse,
        shipping_method: group.isPrimary ? shippingMethod : 'economy',
        shipping_cost: breakdownEntry?.cost ?? 0,
        items: group.items.map(item => ({
          sku: item.sku,
          styleId: item.styleId,
          styleName: item.styleName,
          brandName: item.brandName,
          colorName: item.colorName,
          colorCode: item.colorCode,
          sizeName: item.sizeName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          imageUrl: item.imageUrl,
        })),
      };
    });

    // Now run the follow-up writes in parallel
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
      // Insert order_shipments
      ...(shipmentRows.length > 0
        ? [(supabase as any).from('order_shipments').insert(shipmentRows)] // eslint-disable-line @typescript-eslint/no-explicit-any
        : []),
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
            shipment_count: shipmentGroups.length,
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
        decoration: decorationTotal,
        tax: taxAmount,
        shipping: actualShippingCost,
        discount: discountAmount,
        total: roundedTotal,
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
