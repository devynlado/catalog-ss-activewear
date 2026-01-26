import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface ExitCaptureRequest {
  email: string;
  pageUrl?: string;
  cartItems?: Array<{
    sku: string;
    styleName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExitCaptureRequest = await request.json();

    // Validate required fields
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if we already captured this email today (prevent duplicates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase
      .from('exit_captures')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .gte('created_at', today.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      // Already captured today, just acknowledge
      return NextResponse.json({
        success: true,
        message: 'Email already saved',
      });
    }

    // Insert new exit capture
    await supabase.from('exit_captures').insert({
      email: body.email.toLowerCase(),
      page_url: body.pageUrl || null,
      cart_items: body.cartItems || null,
    });

    console.log(`Exit intent captured for ${body.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email saved successfully',
    });
  } catch (error) {
    console.error('Error capturing exit intent:', error);
    
    return NextResponse.json(
      { error: 'Failed to save email' },
      { status: 500 }
    );
  }
}
