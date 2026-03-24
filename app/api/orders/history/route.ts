import { NextResponse } from 'next/server';
import { getOrderSession } from '@/lib/order-session';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET() {
  const session = await getOrderSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const supabase = getSupabase();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total, items, shipping_cost, created_at, shipped_at, delivered_at, carrier, tracking_number, coupon_code, discount_amount')
    .ilike('customer_email', session.email)
    .neq('payment_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary = (orders || []).map((order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemCount = items.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
    const firstItemImage = items[0]?.imageUrl || null;

    return {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: order.total,
      itemCount,
      productCount: items.length,
      firstItemImage,
      createdAt: order.created_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      hasCoupon: !!order.coupon_code,
    };
  });

  return NextResponse.json({ orders: summary, email: session.email });
}
