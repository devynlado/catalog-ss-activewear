import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { LOGO_URLS } from '@/lib/emails/components';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// In-memory OTP store (codes expire after 10 minutes)
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_VERIFY_ATTEMPTS = 5;
interface OTPRecord {
  code: string;
  email: string;
  createdAt: number;
  verifyAttempts: number;
}
const otpStore = new Map<string, OTPRecord>();

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now - record.createdAt > OTP_EXPIRY_MS) {
      otpStore.delete(key);
    }
  }
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const resend = new Resend(resendKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.garmentdecor.com';

  const { error } = await resend.emails.send({
    from: 'Garment Decor <noreply@garmentdecor.com>',
    to: email,
    subject: 'Your Verification Code – Garment Decor',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #faf6f3;">
        <div style="background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <img src="${LOGO_URLS.wordmarkWhite}" alt="Garment Decor" style="height: 32px; max-width: 160px;">
          </div>
          <div style="padding: 32px;">
            <h1 style="margin: 0 0 8px; font-size: 20px; color: #0f172a; text-align: center;">Your Verification Code</h1>
            <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; text-align: center;">
              Enter this code to access your order dashboard
            </p>
            <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
            </div>
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
              This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e7e5e4; text-align: center;">
            <a href="${siteUrl}" style="color: #f97316; text-decoration: none; font-size: 12px;">garmentdecor.com</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your Garment Decor verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
  });

  return !error;
}

/**
 * POST /api/orders/verify
 *
 * Step 1: { email, token? }           -> sends OTP code to email
 * Step 2: { email, code }             -> verifies OTP and creates session
 * Token flow: { email, token }        -> validates token+email, sends OTP
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const supabase = getSupabase();

  try {
    const { token, email, code } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Step 2: Verify OTP code ──
    if (code) {
      cleanExpiredOTPs();
      const otpRecord = otpStore.get(normalizedEmail);

      if (!otpRecord) {
        return NextResponse.json(
          { error: 'Verification code expired. Please request a new one.' },
          { status: 401 }
        );
      }

      if (otpRecord.verifyAttempts >= MAX_OTP_VERIFY_ATTEMPTS) {
        otpStore.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new code.' },
          { status: 429 }
        );
      }

      if (otpRecord.code !== String(code).trim()) {
        otpRecord.verifyAttempts++;
        return NextResponse.json(
          { error: 'Incorrect code. Please check and try again.' },
          { status: 401 }
        );
      }

      // Code matches — create session
      otpStore.delete(normalizedEmail);

      const { data: session, error: sessionError } = await supabase
        .from('order_tracking_sessions')
        .insert({ email: normalizedEmail })
        .select('session_token, expires_at')
        .single();

      if (sessionError || !session) {
        console.error('Failed to create tracking session:', sessionError);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
      }

      const response = NextResponse.json({ success: true, step: 'verified' });
      const isProduction = process.env.NODE_ENV === 'production';

      response.cookies.set('order_session', session.session_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // ── Step 1: Validate email/token and send OTP ──

    if (token) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, customer_email')
        .eq('access_token', token)
        .single();

      if (error || !order) {
        return NextResponse.json(
          { error: 'Invalid or expired link. Please check your email and try again.' },
          { status: 401 }
        );
      }

      if (order.customer_email.toLowerCase().trim() !== normalizedEmail) {
        return NextResponse.json(
          { error: 'Email does not match this order.' },
          { status: 401 }
        );
      }
    } else {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .ilike('customer_email', normalizedEmail)
        .neq('payment_status', 'pending');

      if (error || !count || count === 0) {
        return NextResponse.json(
          { error: 'No orders found for this email address.' },
          { status: 401 }
        );
      }
    }

    // Generate and send OTP
    const otpCode = generateOTP();
    otpStore.set(normalizedEmail, {
      code: otpCode,
      email: normalizedEmail,
      createdAt: Date.now(),
      verifyAttempts: 0,
    });

    const sent = await sendVerificationEmail(normalizedEmail, otpCode);
    if (!sent) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      step: 'code_sent',
      message: 'Verification code sent to your email.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

/**
 * DELETE /api/orders/verify — Sign out (clear httpOnly session cookie)
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('order_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
