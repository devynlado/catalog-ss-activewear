import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logAdminActivity } from '@/lib/admin-audit';
import { RATE_LIMITS, checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Logs a sign-out event for the currently authenticated admin/sales_rep.
 * Called from the Header dropdown BEFORE the actual `signOut()` call so the
 * Supabase session is still valid when we capture the actor identity.
 */
export async function POST(request: NextRequest) {
  try {
    // Same beacon-style rate limit as sign-in: silently no-op when over.
    const ip = getClientIp(request);
    const rl = await checkRateLimit(ip, RATE_LIMITS.auditBeacon);
    if (!rl.success) {
      console.warn(`[audit/sign-out] beacon rate-limited ip=${ip}`);
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

    await logAdminActivity(request, {
      action: 'auth.signed_out',
      resourceType: 'session',
      resourceId: user.id,
      summary: 'signed out',
      actor: {
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role as 'admin' | 'sales_rep',
      },
    });
  } catch (err) {
    console.error('[audit/sign-out] failed:', err);
  }
  return NextResponse.json(null, { status: 204 });
}
