import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

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
    const { token, email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (token) {
      // Token-based flow: validate token belongs to an order with this email
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
          { error: 'Email does not match this order. Please use the email address you used when placing your order.' },
          { status: 401 }
        );
      }
    } else {
      // Direct flow: check if any orders exist for this email
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

    // Create a tracking session
    const { data: session, error: sessionError } = await supabase
      .from('order_tracking_sessions')
      .insert({ email: normalizedEmail })
      .select('session_token, expires_at')
      .single();

    if (sessionError || !session) {
      console.error('Failed to create tracking session:', sessionError);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('order_session', session.session_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
