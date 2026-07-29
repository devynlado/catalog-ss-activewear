import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { QuoteSubmission } from '@/lib/types';
import {
  generateQuoteNotificationHtml,
  generateQuoteNotificationText,
} from '@/lib/emails/quote-notification';
import {
  generateQuoteConfirmationHtml,
  generateQuoteConfirmationText,
} from '@/lib/emails/quote-confirmation';
import {
  generateProjectQuoteNotificationHtml,
  generateProjectQuoteNotificationText,
  generateProjectQuoteConfirmationHtml,
  generateProjectQuoteConfirmationText,
  type SerializedProject,
} from '@/lib/emails/quote-project-emails';
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
import {
  DECORATION_METHOD_OPTIONS,
  MAX_PROJECTS_PER_QUOTE,
  type QuoteDecorationMethod,
} from '@/lib/quote-form-options';

// -----------------------------------------------------------------------------
// Types for the new project-form payload
// -----------------------------------------------------------------------------

interface QuoteProjectPayload {
  blankSource: 'own' | 'catalog';
  blankOwnDescription?: string;
  catalogCategory?: string | null;
  catalogProduct?: {
    styleId: number;
    styleName: string;
    brandName: string;
    slug: string;
    imageUrl?: string;
  } | null;
  decorationMethod: QuoteDecorationMethod;
  quantityTier?: string;
  colors?: number;
  locations?: string[];
  isDark?: boolean;
  isFleece?: boolean;
  stitchCount?: string;
  numLocations?: number;
  finishingQuantity?: number;
  finishingServices?: string[];
  designNotes?: string;
}

interface QuoteProjectSubmission {
  projects: QuoteProjectPayload[];
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
  };
  eventDate?: string | null;
  submittedAt?: string;
  visitor_source?: string | null;
}

// -----------------------------------------------------------------------------
// Initialize Resend lazily to avoid module-level errors
// -----------------------------------------------------------------------------
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// -----------------------------------------------------------------------------
// Decoration method label lookup — server-side so email/admin never have to
// derive it from an enum.
// -----------------------------------------------------------------------------
const decorationLabelMap: Record<string, string> = Object.fromEntries(
  DECORATION_METHOD_OPTIONS.map((o) => [o.id, o.name]),
);

// Low-bound of a tier like "100-249" — used for lightweight sorting and
// filtering in the admin, plus GA4 event value. Sales use the tier itself.
function estimateFromTier(tier?: string): number {
  if (!tier) return 0;
  const first = tier.split('-')[0]?.replace(/\D/g, '');
  const n = parseInt(first ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

// -----------------------------------------------------------------------------
// Project-payload → SerializedProject (server-side view / storage row)
//
// This shape is what gets JSON.stringify'd into `quotes.items` and what the
// admin renderer + email templates consume. Everything human-friendly is
// pre-computed here so downstream renderers don't need the shared options
// file.
// -----------------------------------------------------------------------------
function serializeProject(
  p: QuoteProjectPayload,
  index: number,
): SerializedProject {
  return {
    type: 'project',
    index,
    blankSource: p.blankSource,
    blankOwnDescription: p.blankOwnDescription ?? null,
    catalogCategory: p.catalogCategory ?? null,
    catalogProduct: p.catalogProduct ?? null,
    decorationMethod: p.decorationMethod,
    decorationLabel:
      decorationLabelMap[p.decorationMethod] ?? p.decorationMethod,
    quantityTier: p.quantityTier ?? null,
    estimatedQuantity:
      p.decorationMethod === 'finishing'
        ? p.finishingQuantity ?? 0
        : estimateFromTier(p.quantityTier),
    colors: p.colors ?? null,
    locations: Array.isArray(p.locations) ? p.locations : null,
    isDark: p.isDark ?? false,
    isFleece: p.isFleece ?? false,
    stitchCount: p.stitchCount ?? null,
    numLocations: p.numLocations ?? null,
    finishingQuantity: p.finishingQuantity ?? null,
    finishingServices: Array.isArray(p.finishingServices)
      ? p.finishingServices
      : null,
    designNotes: p.designNotes?.trim() || null,
  };
}

// -----------------------------------------------------------------------------
// Payload validation for the new project-form shape. Returns an error string
// if invalid, or null if OK.
// -----------------------------------------------------------------------------
function validateProjectPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return 'Invalid payload';
  const b = body as Record<string, unknown>;
  const projects = b.projects;
  if (!Array.isArray(projects) || projects.length === 0) {
    return 'At least one project is required.';
  }
  if (projects.length > MAX_PROJECTS_PER_QUOTE) {
    return `A single quote request can contain at most ${MAX_PROJECTS_PER_QUOTE} projects.`;
  }
  const validMethods = new Set(DECORATION_METHOD_OPTIONS.map((o) => o.id));

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i] as QuoteProjectPayload | undefined;
    if (!p || typeof p !== 'object') {
      return `Project ${i + 1}: invalid shape`;
    }
    if (p.blankSource !== 'own' && p.blankSource !== 'catalog') {
      return `Project ${i + 1}: missing blank source`;
    }
    if (
      p.blankSource === 'own' &&
      (!p.blankOwnDescription || !p.blankOwnDescription.trim())
    ) {
      return `Project ${i + 1}: describe your blank`;
    }
    if (p.blankSource === 'catalog' && !p.catalogCategory && !p.catalogProduct) {
      return `Project ${i + 1}: pick a category or search a product`;
    }
    if (!p.decorationMethod || !validMethods.has(p.decorationMethod)) {
      return `Project ${i + 1}: missing decoration method`;
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// Detect which flavour of payload we received. The old cart-based /quote page
// (and any lingering integrations) posts `items: [...]`; the new project-form
// posts `projects: [...]`. Both share the /api/quote/submit surface so we
// keep the legacy branch working for now — see also
// components/quote/QuoteDrawer.tsx which still ships cart items.
// -----------------------------------------------------------------------------
function isProjectSubmission(body: unknown): body is QuoteProjectSubmission {
  if (typeof body !== 'object' || body === null) return false;
  return Array.isArray((body as { projects?: unknown }).projects);
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Two-layer rate limits mirror /api/contact. Real quotes take minutes to
    // fill out — anyone hitting 5-in-10-minutes is abusive.
    const ip = getClientIp(request);
    const burst = await checkRateLimit(ip, RATE_LIMITS.quoteBurst);
    if (!burst.success) {
      console.warn(
        `[quote/submit] burst limit hit ip=${ip} retry=${burst.retryAfterSeconds}s`,
      );
      return NextResponse.json(
        {
          error: `You've submitted too many quotes recently. Please try again in ${formatRetryAfter(burst.retryAfterSeconds)}, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: burst.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(burst) },
      );
    }
    const daily = await checkRateLimit(ip, RATE_LIMITS.quoteDaily);
    if (!daily.success) {
      console.warn(
        `[quote/submit] daily limit hit ip=${ip} retry=${daily.retryAfterSeconds}s`,
      );
      return NextResponse.json(
        {
          error: `You've reached today's quote submission limit. Please try again tomorrow, or call us at (855) 942-7636.`,
          rateLimited: true,
          retryAfterSeconds: daily.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(daily) },
      );
    }

    const rawBody = await request.json();

    // Honeypot — silent success for bots (mirrors /api/contact behaviour).
    if (isHoneypotTriggered(rawBody)) {
      const email =
        (rawBody as { contact?: { email?: string } })?.contact?.email ??
        'unknown';
      console.log(`[Quote] Honeypot triggered ip=${ip} email=${email}`);
      return NextResponse.json({
        success: true,
        message: 'Quote submitted successfully',
        quoteId: `QT-${Date.now().toString(36).toUpperCase()}`,
        summary: { totalItems: 0, subtotal: 0 },
      });
    }

    // Turnstile — fail-open on Cloudflare outage (see lib/turnstile.ts).
    const turnstileToken = readTurnstileToken(rawBody);
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      console.warn(
        `[Quote] Turnstile rejected ip=${ip} reason=${turnstileResult.reason} codes=${turnstileResult.errorCodes?.join(',') ?? 'none'}`,
      );
      return NextResponse.json(
        {
          error:
            turnstileResult.reason === 'missing'
              ? 'Please complete the security check before submitting.'
              : 'Security check failed. Please refresh the page and try again.',
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------
    // Branch: project-form submission (the new /quote page)
    // -------------------------------------------------------------------
    if (isProjectSubmission(rawBody)) {
      const body = rawBody as QuoteProjectSubmission;

      if (!body.contact?.email || !body.contact?.name) {
        return NextResponse.json(
          { error: 'Contact name and email are required' },
          { status: 400 },
        );
      }

      const validationError = validateProjectPayload(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const serialized = body.projects.map((p, i) => serializeProject(p, i));
      const totalPieces = serialized.reduce(
        (sum, p) => sum + p.estimatedQuantity,
        0,
      );
      const quoteId = `QT-${Date.now().toString(36).toUpperCase()}`;

      // Emails
      const resend = getResend();
      const teamEmail =
        process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';

      const emailProps = {
        quoteId,
        contact: body.contact,
        projects: serialized,
        eventDate: body.eventDate ?? null,
        message: body.contact.message,
        totalPieces,
      };

      const emailPromises = [
        resend.emails.send({
          from: 'Garment Decor <quotes@garmentdecor.com>',
          to: teamEmail,
          subject: `New Quote Request - ${quoteId} - ${body.contact.name}`,
          html: generateProjectQuoteNotificationHtml(emailProps),
          text: generateProjectQuoteNotificationText(emailProps),
          replyTo: body.contact.email,
        }),
        resend.emails.send({
          from: 'Garment Decor <quotes@garmentdecor.com>',
          to: body.contact.email,
          subject: `Quote Received! - ${quoteId} - Garment Decor`,
          html: generateProjectQuoteConfirmationHtml({
            quoteId,
            customerName: body.contact.name,
            projects: serialized,
            totalPieces,
          }),
          text: generateProjectQuoteConfirmationText({
            quoteId,
            customerName: body.contact.name,
            projects: serialized,
            totalPieces,
          }),
        }),
      ];

      const results = await Promise.allSettled(emailPromises);
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some emails failed to send:', failures);
        if (failures.length === results.length) {
          throw new Error('All emails failed to send');
        }
      }

      // Persist to Supabase — feeds /admin/quotes.
      //
      // We reuse the `items` JSONB column with `type: 'project'` markers on
      // each element. Subtotal is 0 because the form doesn't collect prices
      // (that's the sales team's job). `decoration` and `finishing` at the
      // row level stay null — per-project decoration lives inside each
      // items[].decorationMethod.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createServerSupabaseClient() as any;
        await supabase.from('quotes').insert({
          quote_id: quoteId,
          customer_name: body.contact.name,
          customer_email: body.contact.email,
          customer_phone: body.contact.phone || null,
          company: body.contact.company || null,
          items: serialized,
          decoration: null,
          finishing: null,
          notes: body.contact.message || null,
          subtotal: 0,
          status: 'new',
          visitor_source: body.visitor_source || null,
        });
        console.log(`Quote ${quoteId} saved to Supabase (project form)`);
      } catch (dbError) {
        // Non-fatal: emails already sent, admin will see it via inbox.
        console.error('Failed to save quote to Supabase:', dbError);
      }

      console.log(
        `Quote ${quoteId} submitted successfully for ${body.contact.email} (${serialized.length} project(s), ~${totalPieces} pieces)`,
      );

      return NextResponse.json({
        success: true,
        message: 'Quote submitted successfully',
        quoteId,
        summary: {
          totalItems: serialized.length,
          totalPieces,
        },
      });
    }

    // -------------------------------------------------------------------
    // Branch: legacy cart-based submission
    // -------------------------------------------------------------------
    const body: QuoteSubmission = rawBody;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Quote must contain at least one item' },
        { status: 400 },
      );
    }

    if (!body.contact?.email || !body.contact?.name) {
      return NextResponse.json(
        { error: 'Contact name and email are required' },
        { status: 400 },
      );
    }

    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const totalItems = body.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const quoteId = `QT-${Date.now().toString(36).toUpperCase()}`;

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

    const resend = getResend();
    const emailPromises = [];

    const teamEmail = process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';
    emailPromises.push(
      resend.emails.send({
        from: 'Garment Decor <quotes@garmentdecor.com>',
        to: teamEmail,
        subject: `New Quote Request - ${quoteId} - ${body.contact.name}`,
        html: generateQuoteNotificationHtml(emailData),
        text: generateQuoteNotificationText(emailData),
        replyTo: body.contact.email,
      }),
    );

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
      }),
    );

    const results = await Promise.allSettled(emailPromises);
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures);
      if (failures.length === results.length) {
        throw new Error('All emails failed to send');
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        visitor_source: (body as { visitor_source?: string | null }).visitor_source || null,
      });
      console.log(`Quote ${quoteId} saved to Supabase`);
    } catch (dbError) {
      console.error('Failed to save quote to Supabase:', dbError);
    }

    console.log(
      `Quote ${quoteId} submitted successfully for ${body.contact.email}`,
    );

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

    if (error instanceof Error && error.message.includes('Resend')) {
      return NextResponse.json(
        {
          error:
            'Failed to send confirmation email. Please try again or call us at (855) 942-7636.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error:
          'Failed to submit quote. Please try again or call us at (855) 942-7636.',
      },
      { status: 500 },
    );
  }
}
