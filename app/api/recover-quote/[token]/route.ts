import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerSupabaseClient() as any;
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', code: 'TOKEN_MISSING' },
        { status: 400 }
      );
    }

    // Look up the exit capture by recovery token
    const { data: capture, error } = await supabase
      .from('exit_captures')
      .select('*')
      .eq('recovery_token', token)
      .single();

    if (error || !capture) {
      console.log(`[Recovery] Token not found: ${token.slice(0, 8)}...`);
      return NextResponse.json(
        { error: 'Invalid recovery link', code: 'TOKEN_INVALID' },
        { status: 404 }
      );
    }

    // Check if already recovered
    if (capture.recovered_at) {
      console.log(`[Recovery] Token already used: ${token.slice(0, 8)}...`);
      return NextResponse.json(
        { error: 'This link has already been used', code: 'TOKEN_USED' },
        { status: 409 }
      );
    }

    // Check if expired
    const expiresAt = new Date(capture.expires_at);
    if (expiresAt < new Date()) {
      console.log(`[Recovery] Token expired: ${token.slice(0, 8)}...`);
      return NextResponse.json(
        { error: 'This recovery link has expired', code: 'TOKEN_EXPIRED' },
        { status: 410 }
      );
    }

    // Mark as recovered
    await supabase
      .from('exit_captures')
      .update({ recovered_at: new Date().toISOString() })
      .eq('id', capture.id);

    console.log(`[Recovery] Successfully recovered quote for ${capture.email}`);

    return NextResponse.json({
      success: true,
      email: capture.email,
      cartItems: capture.cart_items || [],
    });
  } catch (error) {
    console.error('[Recovery] Error:', error);
    return NextResponse.json(
      { error: 'Failed to recover quote', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
