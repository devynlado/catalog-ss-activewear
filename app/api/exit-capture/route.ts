import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/lib/supabase';
import { 
  generateSaveQuoteRecoveryHtml, 
  generateSaveQuoteRecoveryText,
  getRecoverySubject,
} from '@/lib/emails/save-quote-recovery';
import { maskEmail } from '@/lib/emails/components';

// Rate limiting constants
const RATE_LIMIT = 3; // Max emails per address per day
const RATE_WINDOW_HOURS = 24;

interface ExitCaptureRequest {
  email: string;
  pageUrl?: string;
  cartItems?: Array<{
    sku?: string;
    styleName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Initialize Resend lazily
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body: ExitCaptureRequest = await request.json();

    // Validate required fields
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required', code: 'EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    // Normalize email
    const email = body.email.toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'EMAIL_INVALID' },
        { status: 400 }
      );
    }

    // Validate cart items exist
    if (!body.cartItems || body.cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required', code: 'CART_EMPTY' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient() as any;

    // Rate limiting: Check how many emails sent to this address in the last 24 hours
    const rateLimitSince = new Date(Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000);
    const { data: recentCaptures, error: countError } = await supabase
      .from('exit_captures')
      .select('id', { count: 'exact' })
      .eq('email', email)
      .not('email_sent_at', 'is', null)
      .gte('email_sent_at', rateLimitSince.toISOString());

    if (!countError && recentCaptures && recentCaptures.length >= RATE_LIMIT) {
      console.log(`[Exit Capture] Rate limit exceeded for ${email}`);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.', 
          code: 'RATE_LIMITED' 
        },
        { status: 429 }
      );
    }

    // Generate secure recovery token
    const recoveryToken = randomUUID();
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Insert the exit capture with recovery token
    const { data: insertedCapture, error: insertError } = await supabase
      .from('exit_captures')
      .insert({
        email,
        page_url: body.pageUrl || null,
        cart_items: body.cartItems,
        recovery_token: recoveryToken,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Exit Capture] Insert error:', insertError);
      throw new Error('Failed to save quote');
    }

    // Send recovery email
    const itemCount = body.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    try {
      const resend = getResend();
      
      const emailResult = await resend.emails.send({
        from: 'Garment Decor <noreply@garmentdecor.com>',
        to: email,
        subject: getRecoverySubject(itemCount),
        html: generateSaveQuoteRecoveryHtml({
          email,
          recoveryToken,
          cartItems: body.cartItems,
          expiresAt,
        }),
        text: generateSaveQuoteRecoveryText({
          email,
          recoveryToken,
          cartItems: body.cartItems,
          expiresAt,
        }),
      });

      if (emailResult.error) {
        console.error('[Exit Capture] Resend error:', emailResult.error);
        // Don't fail the request, just log it
      } else {
        // Update email_sent_at timestamp
        await supabase
          .from('exit_captures')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', insertedCapture.id);
          
        console.log(`[Exit Capture] Recovery email sent to ${maskEmail(email)}`);
      }
    } catch (emailError) {
      console.error('[Exit Capture] Email send failed:', emailError);
      // Don't fail the request - the capture was saved, email just failed
    }

    console.log(`[Exit Capture] Quote saved for ${maskEmail(email)}, token: ${recoveryToken.slice(0, 8)}...`);

    return NextResponse.json({
      success: true,
      message: 'Quote saved! Check your email for the recovery link.',
      emailSent: true,
      // Return masked email for UI confirmation
      maskedEmail: maskEmail(email),
    });
  } catch (error) {
    console.error('[Exit Capture] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to save quote', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
