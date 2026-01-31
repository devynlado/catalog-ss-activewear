import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// PATCH: Customer updates their quote items (only when status is 'new')
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    // Fetch the quote - must belong to this user AND be in 'new' status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, customer_id, items')
      .eq('id', params.id)
      .eq('customer_id', user.id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Only allow edits when status is 'new'
    if (quote.status !== 'new') {
      return NextResponse.json({ 
        error: 'Quote cannot be edited after it has been reviewed. Please message your rep to request changes.' 
      }, { status: 403 });
    }

    // Calculate new subtotal
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.unitPrice || 0) * (item.quantity || 0);
    }, 0);

    // Update the quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({ 
        items,
        subtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quote items:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the activity
    await supabase.from('quote_activities').insert({
      quote_id: params.id,
      user_id: user.id,
      activity_type: 'items_updated',
      details: { 
        item_count: items.length,
        subtotal 
      },
    });

    return NextResponse.json({ 
      success: true, 
      quote: updatedQuote 
    });

  } catch (error) {
    console.error('Quote items update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
