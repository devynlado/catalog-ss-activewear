import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import {
  RATE_LIMITS,
  buildRateLimitHeaders,
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
} from '@/lib/rate-limit';

const AUTH_COOKIE_NAME = 'admin_auth';
const AUTH_COOKIE_VALUE = 'authenticated';
const MIN_PASSWORD_LENGTH = 12;

/**
 * Constant-time string comparison. Plain `===` leaks the matching prefix
 * length via timing — relevant for password checks even at low traffic.
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  // timingSafeEqual requires equal-length buffers. When lengths differ we
  // still run a comparison against `aBuf` so the timing is similar.
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.ADMIN_PASSWORD;

    // Hard refusal when the env var is missing or weak. Previously this
    // route fell back to a hardcoded default ("garmentdecor2024") if
    // ADMIN_PASSWORD was unset — which meant any preview/staging deploy
    // without that env var was effectively wide open. We now fail closed.
    if (!expected || expected.length < MIN_PASSWORD_LENGTH) {
      console.error(
        `[admin auth] ADMIN_PASSWORD is not configured or is shorter than ${MIN_PASSWORD_LENGTH} characters. Refusing login.`
      );
      return NextResponse.json(
        { error: 'Admin authentication is not configured on this environment.' },
        { status: 503 }
      );
    }

    // Rate limit by IP only (no email is sent on this legacy endpoint).
    // The limit is generous: 10 attempts per 15 min from a single IP. With
    // a 12+ char password the brute-force math is hopeless anyway, so the
    // ceiling is mostly there to make automated probing visible in logs.
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, RATE_LIMITS.adminAuth);
    if (!rl.success) {
      console.warn(
        `[admin auth] rate-limit hit ip=${ip} retry_after=${rl.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${formatRetryAfter(rl.retryAfterSeconds)}.`,
          rateLimited: true,
          retryAfterSeconds: rl.retryAfterSeconds,
        },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (safeEqual(password, expected)) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/admin',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (authCookie?.value === AUTH_COOKIE_VALUE) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
