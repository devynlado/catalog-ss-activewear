import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    // Format line items for GA4 tracking
    const lineItems = session.line_items?.data?.map(item => {
      const product = item.price?.product;
      // Check if product is a full Product object (not string and not deleted)
      const sku = product && typeof product !== 'string' && 'metadata' in product
        ? product.metadata?.sku || item.id 
        : item.id;
      return {
        item_id: sku,
        item_name: item.description || 'Product',
        price: (item.amount_total || 0) / 100 / (item.quantity || 1),
        quantity: item.quantity || 1,
      };
    }) || [];

    return NextResponse.json({
      orderNumber: session.metadata?.orderNumber || null,
      email: session.customer_email,
      total: session.amount_total,
      itemCount: session.metadata?.itemCount || null,
      status: session.payment_status,
      // B2B fields
      poNumber: session.metadata?.poNumber || null,
      orderNotes: session.metadata?.orderNotes || null,
      customerCompany: session.metadata?.customerCompany || null,
      customerName: session.metadata?.customerName || null,
      customerPhone: session.metadata?.customerPhone || null,
      // Shipping
      shippingMethod: session.metadata?.shippingMethod || 'economy',
      totalPieces: session.metadata?.totalPieces || null,
      // GA4 tracking data
      lineItems,
      shippingCost: session.shipping_cost?.amount_total 
        ? session.shipping_cost.amount_total / 100 
        : 0,
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
