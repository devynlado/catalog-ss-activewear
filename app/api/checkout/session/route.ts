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
      expand: ['line_items'],
    });

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
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
