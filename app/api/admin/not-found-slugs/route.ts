import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-redirects';

/**
 * GET /api/admin/not-found-slugs
 *
 * Lists slug misses logged from app/product/[slug]/page.tsx. By default
 * returns only unresolved, human-driven hits (the actionable queue).
 *
 * Query params:
 *   includeResolved=true  – include rows already converted to a redirect
 *   includeBots=true      – include bot/scanner traffic
 *   limit                 – default 200, max 500
 */
export async function GET(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const url = request.nextUrl;
  const includeResolved = url.searchParams.get('includeResolved') === 'true';
  const includeBots = url.searchParams.get('includeBots') === 'true';
  const limitRaw = parseInt(url.searchParams.get('limit') || '200', 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 200, 1), 500);

  // not_found_slugs isn't in the generated Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;
  let query = supabase
    .from('not_found_slugs')
    .select(
      'slug, hits, is_bot, first_seen, last_seen, last_referrer, last_user_agent, resolved, resolved_at, resolution_type, resolution_redirect_id',
    )
    .order('last_seen', { ascending: false })
    .limit(limit);

  if (!includeResolved) query = query.eq('resolved', false);
  if (!includeBots) query = query.eq('is_bot', false);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slugs: data ?? [] });
}
