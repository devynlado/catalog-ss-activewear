import { NextRequest, NextResponse } from 'next/server';
import { stripe, generateOrderNumber, calculateOrderTotals, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { CartItem } from '@/lib/database.types';

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
  embedded?: boolean; // Use embedded checkout mode
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, shippingInfo, shippingMethod, poNumber, orderNotes, embedded = true } = body;

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

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create line items for Stripe
    const lineItems = items.map((item) => {
      const unitPrice = item.discountedPrice ?? item.unitPrice;
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.brandName} ${item.styleName}`,
            description: `${item.colorName} / ${item.sizeName}`,
            images: item.imageUrl ? [item.imageUrl] : undefined,
            metadata: {
              sku: item.sku,
              styleId: item.styleId.toString(),
              colorCode: item.colorCode,
              sizeName: item.sizeName,
            },
          },
          unit_amount: toStripeCents(unitPrice),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item if not free
    if (actualShippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: shippingMethod === 'same_day' ? 'Express Shipping' : 'Economy Shipping',
            description: shippingMethod === 'same_day' ? '1-2 business days' : '3-5 business days',
          },
          unit_amount: toStripeCents(actualShippingCost),
        },
        quantity: 1,
      } as any);
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (request.headers.get('origin') ?? 'http://localhost:3000');

    // Build metadata with B2B fields
    const metadata: Record<string, string> = {
      orderNumber,
      shippingMethod,
      customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      customerPhone: shippingInfo.phone,
      customerCompany: shippingInfo.company || '',
      itemCount: items.length.toString(),
      totalPieces: items.reduce((sum, item) => sum + item.quantity, 0).toString(),
    };

    // Add B2B fields if provided
    if (poNumber) {
      metadata.poNumber = poNumber;
    }
    if (orderNotes) {
      metadata.orderNotes = orderNotes;
    }

    // Shipping address for prefilling
    const shippingAddress = {
      line1: shippingInfo.address,
      line2: shippingInfo.apartment || undefined,
      city: shippingInfo.city,
      state: shippingInfo.state,
      postal_code: shippingInfo.zipCode,
      country: 'US',
    };

    // Create Stripe Checkout Session
    if (embedded) {
      // Embedded checkout mode - returns client_secret
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: shippingInfo.email,
        automatic_tax: {
          enabled: true,
        },
        metadata,
        // Pre-fill shipping details for embedded checkout
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
        phone_number_collection: {
          enabled: true,
        },
        billing_address_collection: 'required',
      });

      return NextResponse.json({
        clientSecret: session.client_secret,
        sessionId: session.id,
        orderNumber,
      });
    } else {
      // Hosted checkout mode - returns redirect URL
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?canceled=true`,
        customer_email: shippingInfo.email,
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
        automatic_tax: {
          enabled: true,
        },
        metadata,
        phone_number_collection: {
          enabled: true,
        },
        billing_address_collection: 'required',
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        orderNumber,
      });
    }
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
