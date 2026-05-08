import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { 
  generateContactNotificationHtml, 
  generateContactNotificationText 
} from '@/lib/emails/contact-notification';
import {
  generateContactConfirmationHtml,
  generateContactConfirmationText,
  getContactConfirmationSubject,
} from '@/lib/emails/contact-confirmation';
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

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  service?: string;
  source?: string;            // Lead source (e.g., lp_screen_printing)
  variant?: string;           // A/B test variant
  quantity?: string;          // Estimated quantity from LP form
  visitor_source?: string;    // Traffic channel (e.g., Google Ads, Organic Search)
  resolved_location?: string; // Dynamic copy location (e.g., "Pasadena")
  copy_variant?: string;      // keyword_location | geo_location | default
  resolution_source?: string; // url_param | geo_ip | fallback
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit two ways: a tight burst window (5 / 10 min) to stop a
    // single bot hammering us, and a broader daily cap (20 / day) to catch
    // slow-drip spammers who pace themselves under the burst limit.
    const ip = getClientIp(request);
    const burst = await checkRateLimit(ip, RATE_LIMITS.contactBurst);
    if (!burst.success) {
      console.warn(
        `[contact] burst limit hit ip=${ip} retry=${burst.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: `You've sent too many messages recently. Please try again in ${formatRetryAfter(burst.retryAfterSeconds)}, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: burst.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(burst) }
      );
    }
    const daily = await checkRateLimit(ip, RATE_LIMITS.contactDaily);
    if (!daily.success) {
      console.warn(
        `[contact] daily limit hit ip=${ip} retry=${daily.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: `You've reached today's submission limit. Please try again tomorrow, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: daily.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(daily) }
      );
    }

    const rawBody = await request.json();
    const body: ContactFormData = rawBody;

    // Honeypot — silent success for bots that filled the hidden field.
    // Mirrors the existing blocked_emails pattern below: pretend it worked
    // so the bot operator gets no signal and doesn't adapt their script.
    if (isHoneypotTriggered(rawBody)) {
      console.log(`[Contact] Honeypot triggered ip=${ip} email=${body.email ?? 'unknown'}`);
      try {
        const supabase = createServerSupabaseClient() as any;
        await supabase.from('contacts').insert({
          name: body.name ?? '(honeypot)',
          email: body.email ?? '(honeypot)',
          phone: body.phone || null,
          company: body.company || null,
          service: body.service || null,
          message: body.message ?? '',
          source: body.source || null,
          status: 'spam',
          is_spam: true,
          blocked_at: new Date().toISOString(),
        });
      } catch (honeypotInsertErr) {
        console.error('[Contact] Honeypot DB insert failed:', honeypotInsertErr);
      }
      return NextResponse.json({ success: true, message: 'Message sent successfully' });
    }

    // Cloudflare Turnstile — separate from honeypot because it catches
    // smarter bots (real browsers, automated UI tests) that wouldn't fall
    // for the hidden field. Fail-open if Cloudflare itself is down (see
    // lib/turnstile.ts) so a CF outage can't take the contact form offline.
    const turnstileToken = readTurnstileToken(rawBody);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      console.warn(
        `[Contact] Turnstile rejected ip=${ip} reason=${turnstileResult.reason} codes=${turnstileResult.errorCodes?.join(',') ?? 'none'}`
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
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if email is blocked — silently return success so spammers don't adapt
    try {
      const supabase = createServerSupabaseClient() as ReturnType<typeof createServerSupabaseClient>;
      const { data: blocked } = await (supabase as any)
        .from('blocked_emails')
        .select('id')
        .eq('email', body.email.trim().toLowerCase())
        .maybeSingle();

      if (blocked) {
        console.log(`[Contact] Blocked email rejected silently: ${body.email}`);
        // Save to DB anyway as spam for audit trail
        await (supabase as any).from('contacts').insert({
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          company: body.company || null,
          service: body.service || null,
          message: body.message,
          source: body.source || null,
          variant: body.variant || null,
          quantity: body.quantity || null,
          visitor_source: body.visitor_source || null,
          resolved_location: body.resolved_location || null,
          copy_variant: body.copy_variant || null,
          resolution_source: body.resolution_source || null,
          status: 'spam',
          is_spam: true,
          blocked_at: new Date().toISOString(),
        });
        return NextResponse.json({ success: true, message: 'Message sent successfully' });
      }
    } catch (blockCheckErr) {
      console.error('[Contact] Block check failed, proceeding normally:', blockCheckErr);
    }

    const resend = getResend();
    const teamEmail = process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';
    
    // Send notification email to team
    await resend.emails.send({
      from: 'Garment Decor <info@garmentdecor.com>',
      to: teamEmail,
      subject: `New Contact: ${body.name}${body.service ? ` - ${body.service}` : ''}${body.source ? ` [${body.source}]` : ''}`,
      html: generateContactNotificationHtml({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        message: body.message,
        service: body.service,
      }),
      text: generateContactNotificationText({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        message: body.message,
        service: body.service,
      }),
      replyTo: body.email,
    });

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: 'Garment Decor <info@garmentdecor.com>',
        to: body.email,
        subject: getContactConfirmationSubject(),
        html: generateContactConfirmationHtml({
          name: body.name,
          email: body.email,
          phone: body.phone,
          service: body.service,
          quantity: body.quantity,
          message: body.message,
        }),
        text: generateContactConfirmationText({
          name: body.name,
          email: body.email,
          phone: body.phone,
          service: body.service,
          quantity: body.quantity,
          message: body.message,
        }),
      });
      console.log(`Confirmation email sent to ${body.email}`);
    } catch (emailError) {
      // Log but don't fail - team was already notified
      console.error('Failed to send confirmation email:', emailError);
    }

    // Save to Supabase with tracking fields
    try {
      // Cast to any to bypass strict Supabase table typing
      const supabase = createServerSupabaseClient() as any;
      await supabase.from('contacts').insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        service: body.service || null,
        message: body.message,
        source: body.source || null,
        variant: body.variant || null,
        quantity: body.quantity || null,
        visitor_source: body.visitor_source || null,
        resolved_location: body.resolved_location || null,
        copy_variant: body.copy_variant || null,
        resolution_source: body.resolution_source || null,
        status: 'new',
      });
      console.log(`Contact saved to Supabase for ${body.email}`);
    } catch (dbError) {
      // Log but don't fail - emails were already sent
      console.error('Failed to save contact to Supabase:', dbError);
    }

    // Log success for monitoring
    console.log(`Contact form submitted by ${body.email}`);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or call us at (855) 942-7636.' },
      { status: 500 }
    );
  }
}
