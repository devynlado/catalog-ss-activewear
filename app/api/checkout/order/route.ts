import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get('order');

  if (!orderNumber) {
    return NextResponse.json(
      { error: 'Order number required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Fetch order from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      console.error('Error fetching order:', error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch order shipments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shipments } = await (supabase as any)
      .from('order_shipments')
      .select('warehouse, tracking_number, carrier, shipped_at')
      .eq('order_id', order.id)
      .order('shipment_index', { ascending: true });

    // Parse items for GA4 tracking
    const items = order.items || [];
    const lineItems = items.map((item: any) => ({
      item_id: item.sku || item.styleId?.toString() || 'unknown',
      item_name: item.productTitle || item.styleName || item.productName || 'Product',
      price: item.discountedPrice ?? item.unitPrice ?? 0,
      quantity: item.quantity || 1,
    }));

    // Normalize delivery country to ISO 3166-1 alpha-2 (required by Google Customer Reviews).
    // Address autocomplete already stores the short_name (e.g. "US"); fall back to "US" since
    // checkout is restricted to US addresses.
    const rawCountry: string = order.shipping_address?.country || '';
    const deliveryCountry =
      rawCountry.length === 2
        ? rawCountry.toUpperCase()
        : /united states|usa/i.test(rawCountry)
          ? 'US'
          : rawCountry.toUpperCase() || 'US';

    return NextResponse.json({
      orderNumber: order.order_number,
      email: order.customer_email,
      total: Math.round((order.total || 0) * 100), // Convert to cents for consistency
      itemCount: items.length,
      status: order.payment_status,
      // B2B fields
      poNumber: order.metadata?.po_number || null,
      orderNotes: order.notes || null,
      customerCompany: order.company || null,
      customerName: order.customer_name || null,
      customerPhone: order.customer_phone || null,
      // Shipping
      shippingMethod: order.shipping_method || 'economy',
      totalPieces: items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
      deliveryCountry,
      // GA4 tracking data
      lineItems,
      shippingCost: order.shipping_cost || 0,
      // Multi-shipment data
      shipments: shipments && shipments.length > 1 ? shipments : undefined,
    });
  } catch (error) {
    console.error('Error retrieving order:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}
