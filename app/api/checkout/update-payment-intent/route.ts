import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateOrderTotals, toStripeCents, ShippingMethod } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { CartItem } from '@/lib/database.types';

interface UpdatePaymentIntentRequest {
  paymentIntentId: string;
  orderId: string;
  items: CartItem[];
  shippingMethod: ShippingMethod;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdatePaymentIntentRequest = await request.json();
    const { paymentIntentId, orderId, items, shippingMethod } = body;

    if (!paymentIntentId || !orderId || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate new totals with updated shipping method
    const { subtotal, taxAmount, shippingCost, total } = calculateOrderTotals(items, shippingMethod);

    // Update the PaymentIntent amount
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: toStripeCents(total),
      metadata: {
        shipping_method: shippingMethod,
        shipping_cost: shippingCost.toString(),
      },
    });

    // Update the order in database
    const supabase = await createSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: shippingCost,
        total,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      // Non-fatal - the payment intent is updated, order will be corrected on success
    }

    return NextResponse.json({
      success: true,
      totals: { subtotal, taxAmount, shippingCost, total },
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
