import { NextRequest, NextResponse } from 'next/server';
import { getOrderSession } from '@/lib/order-session';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const session = await getOrderSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const supabase = getSupabase();

  // Fetch the order - verify it belongs to this session's email
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', params.orderNumber)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  if (order.customer_email.toLowerCase().trim() !== session.email.toLowerCase().trim()) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // Fetch shipments
  const { data: shipments } = await supabase
    .from('order_shipments')
    .select('*')
    .eq('order_id', order.id)
    .order('shipment_index', { ascending: true });

  // Fetch activity timeline
  const { data: activities } = await supabase
    .from('order_activities')
    .select('id, activity_type, details, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  // Build the response
  const items = Array.isArray(order.items) ? order.items : [];

  return NextResponse.json({
    order: {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      shippedAt: order.shipped_at,
      deliveredAt: order.delivered_at,
      // Items
      items: items.map((item: Record<string, unknown>) => ({
        sku: item.sku || '',
        styleId: item.styleId,
        styleName: item.styleName || '',
        brandName: item.brandName || '',
        productTitle: item.productTitle || item.productName || '',
        colorName: item.colorName || '',
        sizeName: item.sizeName || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discountedPrice: item.discountedPrice ?? null,
        imageUrl: item.imageUrl || '',
        packageType: item.packageType || null,
        packageDisplayName: item.packageDisplayName || null,
      })),
      // Pricing
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      total: order.total,
      couponCode: order.coupon_code || null,
      // Shipping
      shippingAddress: order.shipping_address,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      // Customer
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      company: order.company,
      poNumber: order.po_number,
      notes: order.notes,
    },
    shipments: (shipments || []).map((s: Record<string, unknown>) => ({
      warehouse: s.warehouse,
      carrier: s.carrier,
      trackingNumber: s.tracking_number,
      shippedAt: s.shipped_at,
      deliveredAt: s.delivered_at,
      items: s.items,
    })),
    activities: (activities || []).map((a: Record<string, unknown>) => ({
      type: a.activity_type,
      details: a.details,
      createdAt: a.created_at,
    })),
  });
}
