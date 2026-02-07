import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, toStripeCents } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { calculatePackagePrice, validatePackageOrder } from '@/lib/package-pricing';

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
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Get Supabase client
    const supabase = await createSupabaseServerClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
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
        subtotal: pricing.subtotal,
        shipping_cost: pricing.shipping,
        tax_amount: pricing.tax,
        total: pricing.total,
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
      amount: toStripeCents(pricing.total),
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
      receipt_email: customerEmail,
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
        amount: pricing.total,
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.order_number,
      pricing: {
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        shipping: pricing.shipping,
        total: pricing.total,
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
