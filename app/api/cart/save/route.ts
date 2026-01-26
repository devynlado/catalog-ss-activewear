import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface CartSaveRequest {
  email: string;
  items: Array<{
    sku: string;
    styleName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    quantity: number;
    unitPrice: number;
  }>;
  decoration?: {
    type: string;
    description?: string;
  };
  finishing?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CartSaveRequest = await request.json();

    // Validate required fields
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart must contain at least one item' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if we already have this email's cart saved recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .gte('captured_at', oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing cart
      await supabase
        .from('abandoned_carts')
        .update({
          items: body.items,
          decoration: body.decoration || null,
          finishing: body.finishing || null,
          captured_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
      
      console.log(`Updated abandoned cart for ${body.email}`);
    } else {
      // Insert new abandoned cart
      await supabase.from('abandoned_carts').insert({
        email: body.email.toLowerCase(),
        items: body.items,
        decoration: body.decoration || null,
        finishing: body.finishing || null,
        recovered: false,
      });
      
      console.log(`Saved new abandoned cart for ${body.email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cart saved successfully',
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    );
  }
}
