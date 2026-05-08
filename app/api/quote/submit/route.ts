import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { QuoteSubmission } from '@/lib/types';
import { 
  generateQuoteNotificationHtml, 
  generateQuoteNotificationText 
} from '@/lib/emails/quote-notification';
import { 
  generateQuoteConfirmationHtml, 
  generateQuoteConfirmationText 
} from '@/lib/emails/quote-confirmation';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  RATE_LIMITS,
  buildRateLimitHeaders,
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
} from '@/lib/rate-limit';
import { isHoneypotTriggered } from '@/lib/spam-honeypot';
import { readTurnstileToken, verifyTurnstileToken } from '@/lib/turnstile';

// Initialize Resend lazily to avoid module-level errors
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    // Same two-layer pattern as the contact form: short burst window plus
    // a daily cap. A real quote takes minutes to assemble, so anyone
    // pushing through 5 in 10 minutes is almost certainly abusive.
    const ip = getClientIp(request);
    const burst = await checkRateLimit(ip, RATE_LIMITS.quoteBurst);
    if (!burst.success) {
      console.warn(
        `[quote/submit] burst limit hit ip=${ip} retry=${burst.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: `You've submitted too many quotes recently. Please try again in ${formatRetryAfter(burst.retryAfterSeconds)}, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: burst.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(burst) }
      );
    }
    const daily = await checkRateLimit(ip, RATE_LIMITS.quoteDaily);
    if (!daily.success) {
      console.warn(
        `[quote/submit] daily limit hit ip=${ip} retry=${daily.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: `You've reached today's quote submission limit. Please try again tomorrow, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: daily.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(daily) }
      );
    }

    const rawBody = await request.json();
    const body: QuoteSubmission = rawBody;

    // Honeypot — silent success for bots (mirrors /api/contact behaviour).
    // We don't have a quotes-spam table to mirror the contacts pattern, so
    // we just drop the request and pretend it succeeded.
    if (isHoneypotTriggered(rawBody)) {
      console.log(
        `[Quote] Honeypot triggered ip=${ip} email=${body.contact?.email ?? 'unknown'}`
      );
      return NextResponse.json({
        success: true,
        message: 'Quote submitted successfully',
        quoteId: `QT-${Date.now().toString(36).toUpperCase()}`,
        summary: { totalItems: 0, subtotal: 0 },
      });
    }

    // Cloudflare Turnstile — fail-open on CF outage (see lib/turnstile.ts).
    const turnstileToken = readTurnstileToken(rawBody);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      console.warn(
        `[Quote] Turnstile rejected ip=${ip} reason=${turnstileResult.reason} codes=${turnstileResult.errorCodes?.join(',') ?? 'none'}`
      );
      return NextResponse.json(
        {
          error:
            turnstileResult.reason === 'missing'
              ? 'Please complete the security check before submitting.'
              : 'Security check failed. Please refresh the page and try again.',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Quote must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.contact?.email || !body.contact?.name) {
      return NextResponse.json(
        { error: 'Contact name and email are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalItems = body.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Generate quote ID
    const quoteId = `QT-${Date.now().toString(36).toUpperCase()}`;

    // Prepare email data
    const emailData = {
      quoteId,
      contact: body.contact,
      items: body.items.map((item) => ({
        styleName: item.styleName,
        brandName: item.brandName,
        colorName: item.colorName,
        sizeName: item.sizeName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      decoration: body.decoration,
      finishing: body.finishing,
      eventDate: body.eventDate,
      message: body.contact.message,
      subtotal,
      totalItems,
    };

    // Send emails in parallel
    const resend = getResend();
    const emailPromises = [];

    // 1. Send notification to team
    const teamEmail = process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';
    emailPromises.push(
      resend.emails.send({
        from: 'Garment Decor <quotes@garmentdecor.com>',
        to: teamEmail,
        subject: `New Quote Request - ${quoteId} - ${body.contact.name}`,
        html: generateQuoteNotificationHtml(emailData),
        text: generateQuoteNotificationText(emailData),
        replyTo: body.contact.email,
      })
    );

    // 2. Send confirmation to customer
    emailPromises.push(
      resend.emails.send({
        from: 'Garment Decor <quotes@garmentdecor.com>',
        to: body.contact.email,
        subject: `Quote Received! - ${quoteId} - Garment Decor`,
        html: generateQuoteConfirmationHtml({
          quoteId,
          customerName: body.contact.name,
          items: emailData.items,
          decoration: body.decoration,
          finishing: body.finishing,
          subtotal,
          totalItems,
        }),
        text: generateQuoteConfirmationText({
          quoteId,
          customerName: body.contact.name,
          items: emailData.items,
          decoration: body.decoration,
          finishing: body.finishing,
          subtotal,
          totalItems,
        }),
      })
    );

    // Wait for both emails to send
    const results = await Promise.allSettled(emailPromises);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures);
      // Still return success if at least one email sent
      if (failures.length === results.length) {
        throw new Error('All emails failed to send');
      }
    }

    // Save to Supabase
    try {
      // Cast to any to bypass strict Supabase table typing
      const supabase = createServerSupabaseClient() as any;
      await supabase.from('quotes').insert({
        quote_id: quoteId,
        customer_name: body.contact.name,
        customer_email: body.contact.email,
        customer_phone: body.contact.phone || null,
        company: body.contact.company || null,
        items: body.items,
        decoration: body.decoration || null,
        finishing: body.finishing || null,
        notes: body.contact.message || null,
        subtotal,
        status: 'new',
      });
      console.log(`Quote ${quoteId} saved to Supabase`);
    } catch (dbError) {
      // Log but don't fail - email was already sent
      console.error('Failed to save quote to Supabase:', dbError);
    }

    // Log success for monitoring
    console.log(`Quote ${quoteId} submitted successfully for ${body.contact.email}`);

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quoteId,
      summary: {
        totalItems,
        subtotal,
      },
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    
    // Check if it's a Resend API error
    if (error instanceof Error && error.message.includes('Resend')) {
      return NextResponse.json(
        { error: 'Failed to send confirmation email. Please try again or call us at (855) 942-7636.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit quote. Please try again or call us at (855) 942-7636.' },
      { status: 500 }
    );
  }
}
