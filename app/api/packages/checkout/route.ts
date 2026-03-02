import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, toStripeCents } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { calculatePackagePrice, validatePackageOrder } from '@/lib/package-pricing';
import { validateCoupon } from '@/lib/coupon-utils';

export interface PackageCheckoutRequest {
  // Customer info
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  company?: string;
  
  // Shipping address
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  
  // Package details
  packageType: 'embroidered-caps' | 'trucker-caps' | 'snapback-caps' | 'dad-caps' | 'beanies';
  productStyleId: number;
  productName: string;
  selectedColors: {
    colorCode: string;
    colorName: string;
    quantity: number;
  }[];
  embroideryLocations: string[];
  has3DPuff: boolean;
  
  // Totals from frontend (verified server-side)
  totalQuantity: number;
  
  // Optional
  logoFileUrl?: string;
  orderNotes?: string;
  couponCode?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: PackageCheckoutRequest = await request.json();
    
    const {
      customerEmail,
      customerName,
      customerPhone,
      company,
      shippingAddress,
      packageType,
      productStyleId,
      productName,
      selectedColors,
      embroideryLocations,
      has3DPuff,
      totalQuantity,
      logoFileUrl,
      orderNotes,
      couponCode,
    } = body;
    
    // Validate required fields
    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Customer email and name are required' },
        { status: 400 }
      );
    }
    
    if (!shippingAddress || !shippingAddress.address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }
    
    if (!selectedColors || selectedColors.length === 0) {
      return NextResponse.json(
        { error: 'At least one color must be selected' },
        { status: 400 }
      );
    }
    
    // Verify total quantity matches color breakdown
    const calculatedQuantity = selectedColors.reduce((sum, c) => sum + c.quantity, 0);
    if (calculatedQuantity !== totalQuantity) {
      return NextResponse.json(
        { error: 'Quantity mismatch' },
        { status: 400 }
      );
    }
    
    // Validate package order
    const validation = validatePackageOrder({
      packageType,
      totalQuantity,
      embroideryLocations,
      has3DPuff,
    });
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Calculate pricing server-side
    const pricing = calculatePackagePrice({
      packageType,
      totalQuantity,
      embroideryLocations,
      has3DPuff,
    });

    let discountAmount = 0;
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let finalSubtotal = pricing.subtotal;
    let finalShipping = pricing.shipping;
    let finalTax = pricing.tax;
    let finalTotal = pricing.total;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (couponCode && couponCode.trim()) {
      const supabaseService = createServerSupabaseClient();
      const result = await validateCoupon(supabaseService, {
        code: couponCode.trim(),
        subtotal: pricing.subtotal,
        context: 'packages',
        customerId: user?.id ?? undefined,
        customerEmail: user?.email ?? customerEmail ?? undefined,
      });
      if (result.valid) {
        couponId = result.coupon.id;
        appliedCouponCode = result.coupon.code;
        discountAmount = result.discountAmount;
        finalShipping = result.freeShipping ? 0 : pricing.shipping;
        finalTax = Math.round((pricing.subtotal - discountAmount) * 0.0825 * 100) / 100;
        finalTotal = Math.round((pricing.subtotal - discountAmount + finalShipping + finalTax) * 100) / 100;
      } else {
        return NextResponse.json(
          { error: result.message || 'Coupon is not valid for this order' },
          { status: 400 }
        );
      }
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create package order metadata
    const packageMetadata = {
      order_type: 'package',
      package_type: packageType,
      product_style_id: productStyleId,
      product_name: productName,
      colors: selectedColors,
      embroidery_locations: embroideryLocations,
      has_3d_puff: has3DPuff,
      logo_file_url: logoFileUrl || null,
      pricing: {
        base_price: pricing.basePrice,
        addon_price: pricing.addonPrice,
        price_per_hat: pricing.pricePerHat,
        tier_label: pricing.tierLabel,
      },
    };
    
    // Create pending order in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user?.id || null,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || shippingAddress.phone,
        company: company || shippingAddress.company,
        // Store package details as items array for consistency
        items: [{
          type: 'package',
          packageType,
          productStyleId,
          productName,
          colors: selectedColors,
          totalQuantity,
          embroideryLocations,
          has3DPuff,
          pricePerHat: pricing.pricePerHat,
          subtotal: pricing.subtotal,
        }],
        subtotal: finalSubtotal,
        shipping_cost: finalShipping,
        tax_amount: finalTax,
        discount_amount: discountAmount,
        total: finalTotal,
        coupon_id: couponId,
        coupon_code: appliedCouponCode,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        notes: orderNotes || null,
        metadata: packageMetadata,
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
        order_type: 'package',
        package_type: packageType,
        total_quantity: totalQuantity,
        total: pricing.total,
      },
    });
    
    // Build add-ons list for metadata
    const addonsList: string[] = [];
    if (embroideryLocations.includes('side')) addonsList.push('Side Embroidery');
    if (embroideryLocations.includes('back')) addonsList.push('Back Embroidery');
    if (has3DPuff) addonsList.push('3D Puff');
    
    // Create Stripe PaymentIntent with comprehensive metadata for webhook
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeCents(finalTotal),
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        order_type: 'package',
        package_type: packageType,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || '',
        customer_company: company || '',
        product_name: productName,
        total_quantity: totalQuantity.toString(),
        color_summary: selectedColors.map(c => c.colorName).join(', '),
        addons: addonsList.join(', '),
        logo_url: logoFileUrl || '',
        notes: orderNotes || '',
      },
      description: `Package Order ${orderNumber} - ${totalQuantity} Custom Embroidered Caps`,
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
        amount: finalTotal,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.order_number,
      pricing: {
        subtotal: finalSubtotal,
        tax: finalTax,
        shipping: finalShipping,
        total: finalTotal,
        discount: discountAmount,
        pricePerHat: pricing.pricePerHat,
        tierLabel: pricing.tierLabel,
      },
    });
    
  } catch (error) {
    console.error('Package checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
