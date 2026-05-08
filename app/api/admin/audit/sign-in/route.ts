import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logAdminActivity } from '@/lib/admin-audit';
import { RATE_LIMITS, checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Logs a sign-in event for the currently authenticated admin/sales_rep.
 * Called by the login page (after a successful email/password sign-in)
 * and by the OAuth callback. Returns 204 in all cases — failures here
 * must never block the user from signing in.
 */
export async function POST(request: NextRequest) {
  try {
    // Audit beacon: a single sign-in fires this once. Anything significantly
    // higher than that is abusive (a script trying to flood the activity
    // log). We silently no-op on rate-limit hits — the caller fires this
    // beacon with `keepalive: true` and ignores the response, so returning
    // 204 vs 429 doesn't matter to the user. Logging it lets us see the
    // attack pattern in our server logs.
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, RATE_LIMITS.auditBeacon);
    if (!rl.success) {
      console.warn(`[audit/sign-in] beacon rate-limited ip=${ip}`);
      return NextResponse.json(null, { status: 204 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null, { status: 204 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single<{ id: string; full_name: string | null; role: string }>();

    if (
      !profile ||
      (profile.role !== 'admin' && profile.role !== 'sales_rep')
    ) {
      return NextResponse.json(null, { status: 204 });
    }

    let method: 'oauth' | 'password' = 'password';
    try {
      const body = await request.json();
      if (body?.method === 'oauth') method = 'oauth';
    } catch {
      // body is optional
    }

    await logAdminActivity(request, {
      action: 'auth.signed_in',
      resourceType: 'session',
      resourceId: user.id,
      summary:
        method === 'oauth'
          ? 'signed in via Google'
          : 'signed in with email and password',
      actor: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role as 'admin' | 'sales_rep',
      },
    });
  } catch (err) {
    console.error('[audit/sign-in] failed:', err);
  }
  return NextResponse.json(null, { status: 204 });
}
