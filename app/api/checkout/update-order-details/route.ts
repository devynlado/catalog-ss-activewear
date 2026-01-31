import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ShippingAddress } from '@/lib/database.types';

interface UpdateOrderDetailsRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  company?: string;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  poNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateOrderDetailsRequest = await request.json();
    const { 
      orderId, 
      customerEmail, 
      customerName, 
      customerPhone,
      company,
      shippingAddress, 
      billingAddress,
      poNumber 
    } = body;

    if (!orderId || !customerEmail || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Update the order with actual customer details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        company: company || null,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        po_number: poNumber || null,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order details:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order details' },
        { status: 500 }
      );
    }

    // Log the update
    await supabase.from('order_activities').insert({
      order_id: orderId,
      activity_type: 'order_updated',
      description: 'Customer details updated before payment',
      metadata: { 
        customer_email: customerEmail,
        has_po_number: !!poNumber,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order details:', error);
    return NextResponse.json(
      { error: 'Failed to update order details' },
      { status: 500 }
    );
  }
}
