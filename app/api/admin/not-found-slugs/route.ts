import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { logAdminActivity } from '@/lib/admin-audit';
import { getServerUser } from '@/lib/supabase-server';
import { isBlocklistedPath, normalizePath } from '@/lib/slug-redirects';
import { requireAdmin, markNotFoundResolved } from '@/lib/admin-redirects';

interface NotFoundPathDbRow {
  path: string;
  hits: number;
  is_bot: boolean;
  first_seen: string;
  last_seen: string;
  last_referrer: string | null;
  last_user_agent: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_redirect_id: string | null;
}

/**
 * GET /api/admin/not-found-slugs
 *
 * Lists 404 misses logged by app/not-found.tsx. By default returns only
 * unresolved, human-driven hits (the actionable queue).
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
      'path, hits, is_bot, first_seen, last_seen, last_referrer, last_user_agent, resolved, resolved_at, resolution_type, resolution_redirect_id',
    )
    .order('last_seen', { ascending: false })
    .limit(limit);

  if (!includeResolved) query = query.eq('resolved', false);
  if (!includeBots) query = query.eq('is_bot', false);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter at read time so historical rows for paths that are now
  // blocklisted (admin/dashboard/auth/etc.) disappear from the queue
  // without needing a destructive DB cleanup. New writes are already
  // blocked by the same predicate in lib/slug-redirects.ts::logNotFoundSlug,
  // so this filter only matters until the existing pollution ages out.
  const rows = ((data ?? []) as NotFoundPathDbRow[]).filter(
    (r) => !isBlocklistedPath(r.path),
  );

  return NextResponse.json({ paths: rows });
}

/**
 * PATCH /api/admin/not-found-slugs
 * Admin actions on a single unresolved path. Currently supported:
 *
 *   { path: '/services/old-name', action: 'ignore' }
 *     → mark as junk/spam so it leaves the queue without creating a
 *       redirect.
 *
 * (The 'redirect' resolution path is handled by POST /api/admin/redirects
 *  with `resolved_path_key` set — that flow creates the redirect row AND
 *  marks the not_found_slug as resolved in a single request.)
 *
 * The path lives in the JSON body rather than as a URL segment because
 * full paths contain '/' which Next.js / Vercel routing rejects in
 * dynamic segments even when URL-encoded.
 */
export async function PATCH(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = (await request.json().catch(() => ({}))) as {
    path?: string;
    action?: string;
  };

  const path = normalizePath(body.path ?? '');
  if (!path) {
    return NextResponse.json({ error: 'path is required' }, { status: 400 });
  }
  if (body.action !== 'ignore') {
    return NextResponse.json(
      { error: "Supported actions: 'ignore'" },
      { status: 400 },
    );
  }

  const { user } = await getServerUser();
  await markNotFoundResolved(path, 'ignored', null, user?.id ?? null);

  await logAdminActivity(request, {
    action: 'slug_redirect.miss_ignored',
    resourceType: 'not_found_slug',
    resourceId: path,
    summary: `ignored unresolved path ${path}`,
  });

  return NextResponse.json({ ok: true });
}
