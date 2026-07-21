import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, toStripeCents } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  calculatePackagePrice,
  validatePackageOrder,
  calculatePrintPackagePrice,
  validatePrintPackageOrder,
  isPrintPackageType,
} from '@/lib/package-pricing';
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
  packageType:
    | 'embroidered-caps'
    | 'trucker-caps'
    | 'snapback-caps'
    | 'dad-caps'
    | 'beanies'
    | 'printed-tees-gildan'
    | 'printed-tees-comfort-colors'
    | 'printed-totes-isabella';
  productStyleId: number;
  productName: string;
  selectedColors: {
    colorCode: string;
    colorName: string;
    quantity: number;
    sizeBreakdown?: Record<string, number>;
  }[];
  // Embroidery packages (caps / beanies)
  embroideryLocations?: string[];
  has3DPuff?: boolean;
  // Screen-print packages (tees / totes)
  printColors?: number;
  printLocations?: string[];
  sizeBreakdown?: {
    preset?: string;
    usePerColor?: boolean;
    sizes?: Record<string, number>;
    perColorSizes?: Record<string, Record<string, number>>;
  };
  
  // Totals from frontend (verified server-side)
  totalQuantity: number;
  
  // Optional
  logoFileUrl?: string;
  orderNotes?: string;
  couponCode?: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
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
      printColors,
      printLocations,
      sizeBreakdown,
      totalQuantity,
      logoFileUrl,
      orderNotes,
      couponCode,
      utm_source,
      utm_medium,
      utm_campaign,
      gclid,
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
    
    // Package flavor determines validation, pricing and how we store the item.
    const isPrintPackage = isPrintPackageType(packageType);
    const decorationMethod = isPrintPackage ? 'screen-print' : 'embroidery';
    const normalizedPrintLocations = printLocations && printLocations.length > 0 ? printLocations : ['front'];
    const normalizedEmbLocations = embroideryLocations && embroideryLocations.length > 0 ? embroideryLocations : ['front'];

    // Validate + price server-side (authoritative — never trust client totals)
    let pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
      pricePerUnit: number;
      tierLabel: string;
      basePrice: number;
      addonPrice: number;
    };

    if (isPrintPackage) {
      const validation = validatePrintPackageOrder({
        packageType,
        totalQuantity,
        printColors: printColors || 1,
        printLocations: normalizedPrintLocations,
      });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const p = calculatePrintPackagePrice({
        packageType,
        totalQuantity,
        printColors: printColors || 1,
        printLocations: normalizedPrintLocations,
      });
      pricing = {
        subtotal: p.subtotal,
        tax: p.tax,
        shipping: p.shipping,
        total: p.total,
        pricePerUnit: p.pricePerUnit,
        tierLabel: p.tierLabel,
        basePrice: p.blankCost,
        addonPrice: p.printCost,
      };
    } else {
      // Embroidery packages (caps / beanies)
      const embInput = {
        packageType: packageType as 'embroidered-caps' | 'trucker-caps' | 'snapback-caps' | 'dad-caps' | 'beanies',
        totalQuantity,
        embroideryLocations: normalizedEmbLocations,
        has3DPuff: !!has3DPuff,
      };
      const validation = validatePackageOrder(embInput);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const p = calculatePackagePrice(embInput);
      pricing = {
        subtotal: p.subtotal,
        tax: p.tax,
        shipping: p.shipping,
        total: p.total,
        pricePerUnit: p.pricePerHat,
        tierLabel: p.tierLabel,
        basePrice: p.basePrice,
        addonPrice: p.addonPrice,
      };
    }

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

    // Look up average blank COGS for this product style
    const supabaseService = createServerSupabaseClient();
    const { data: skuCosts } = await supabaseService
      .from('product_skus')
      .select('cogs')
      .eq('style_id', productStyleId)
      .not('cogs', 'is', null) as { data: { cogs: number }[] | null };
    const avgBlankCogs = skuCosts && skuCosts.length > 0
      ? skuCosts.reduce((sum, s) => sum + Number(s.cogs), 0) / skuCosts.length
      : null;
    const totalCogs = avgBlankCogs !== null
      ? Math.round(avgBlankCogs * totalQuantity * 100) / 100
      : null;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Unit noun used in labels / emails
    const productUnit = isPrintPackage
      ? (packageType === 'printed-totes-isabella' ? 'bags' : 'shirts')
      : (packageType === 'beanies' ? 'beanies' : 'caps');

    // Attach per-color size breakdown (screen-print tees) so order emails and the
    // admin can show per-size counts. Caps/totes have no size split.
    const perColorSizes = sizeBreakdown?.perColorSizes;
    const colorsForStorage = selectedColors.map((c) => ({
      ...c,
      sizeBreakdown: c.sizeBreakdown ?? perColorSizes?.[c.colorCode],
    }));

    // Create package order metadata (method-aware)
    const packageMetadata = {
      order_type: 'package',
      package_type: packageType,
      decoration_method: decorationMethod,
      product_style_id: productStyleId,
      product_name: productName,
      product_unit: productUnit,
      colors: colorsForStorage,
      ...(isPrintPackage
        ? {
            print_colors: printColors || null,
            print_locations: normalizedPrintLocations,
            size_breakdown: sizeBreakdown || null,
          }
        : {
            embroidery_locations: normalizedEmbLocations,
            has_3d_puff: !!has3DPuff,
          }),
      logo_file_url: logoFileUrl || null,
      pricing: {
        base_price: pricing.basePrice,
        addon_price: pricing.addonPrice,
        price_per_hat: pricing.pricePerUnit,
        price_per_unit: pricing.pricePerUnit,
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
        // Store package details as items array for consistency.
        // pricePerHat kept for backward-compat with admin renderers that read it;
        // pricePerUnit mirrors it for the webhook/email layer.
        items: [{
          type: 'package',
          packageType,
          decorationMethod,
          productStyleId,
          productName,
          productUnit,
          colors: colorsForStorage,
          totalQuantity,
          ...(isPrintPackage
            ? {
                printColors: printColors || null,
                printLocations: normalizedPrintLocations,
                sizeBreakdown: sizeBreakdown || null,
              }
            : {
                embroideryLocations: normalizedEmbLocations,
                has3DPuff: !!has3DPuff,
              }),
          pricePerHat: pricing.pricePerUnit,
          pricePerUnit: pricing.pricePerUnit,
          subtotal: pricing.subtotal,
          blankCogs: avgBlankCogs,
        }],
        subtotal: finalSubtotal,
        shipping_cost: finalShipping,
        tax_amount: finalTax,
        discount_amount: discountAmount,
        total: finalTotal,
        total_cogs: totalCogs,
        cogs_source: 'live',
        coupon_id: couponId,
        coupon_code: appliedCouponCode,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        notes: orderNotes || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        gclid: gclid || null,
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
    
    // Build add-ons list for metadata (method-aware)
    const addonsList: string[] = [];
    if (isPrintPackage) {
      addonsList.push(`${printColors || 1}-color print`);
      if (normalizedPrintLocations.includes('back')) addonsList.push('Back Print');
    } else {
      if (normalizedEmbLocations.includes('side')) addonsList.push('Side Embroidery');
      if (normalizedEmbLocations.includes('back')) addonsList.push('Back Embroidery');
      if (has3DPuff) addonsList.push('3D Puff');
    }
    
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
        decoration_method: decorationMethod,
        product_unit: productUnit,
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
      description: `Package Order ${orderNumber} - ${totalQuantity} ${productName}`,
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
        pricePerHat: pricing.pricePerUnit,
        pricePerUnit: pricing.pricePerUnit,
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
