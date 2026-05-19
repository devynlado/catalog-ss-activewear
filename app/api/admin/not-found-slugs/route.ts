import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { logAdminActivity } from '@/lib/admin-audit';
import { getServerUser } from '@/lib/supabase-server';
import { isBlocklistedPath, normalizePath } from '@/lib/slug-redirects';
import { requireAdmin } from '@/lib/admin-redirects';
import { getProductBySlug } from '@/lib/product-cache';

/** Hard cap on a single bulk-ignore request. Keeps payloads sane and gives
 *  the audit log a coherent unit of work. Admins with bigger queues can
 *  just submit another batch. */
const MAX_BULK = 500;

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
 * Live verification: returns true ONLY if the path is still genuinely a
 * 404 right now (and therefore belongs in the queue).
 *
 * The path is checked in one of two ways:
 *
 *   A) FAST PATH for `/product/<slug>` — look up the slug directly in the
 *      Supabase product cache. If a row exists, the product page renders
 *      a 200 response (the regular product UI when active, or the
 *      "discontinued" UI when hidden / inactive — both 200). Only a
 *      genuinely missing slug makes the page call `notFound()`. This
 *      avoids the HTTP roundtrip entirely and, critically, avoids the
 *      product page's heavy SS Activewear fetches that can take 5–10 s
 *      and trip our HTTP timeout below.
 *
 *   B) SLOW PATH for every other path — probe the origin over HTTP.
 *        200         → real page → hide from queue
 *        3xx         → middleware redirect or admin-created redirect → hide
 *        404         → real, current 404 → keep
 *        anything else (5xx, network error, timeout) → keep, conservative
 *
 * The `x-internal-verify` header tells app/not-found.tsx to skip writing
 * to the queue for this probe, which would otherwise create a feedback
 * loop where every admin page-load bumped every row's `hits` counter.
 */
async function verifyStill404(origin: string, path: string): Promise<boolean> {
  // A) Product fast path.
  if (path.startsWith('/product/')) {
    const slug = path.slice('/product/'.length);
    if (slug.length > 0) {
      try {
        const product = await getProductBySlug(slug);
        // Any cache hit at all means the page renders 200. We don't
        // need to gate on isActive / manuallyHidden because the page
        // serves the DiscontinuedProductPage in those cases, which is
        // a 200 response — not a 404.
        if (product) return false;
        // Cache miss does NOT prove a 404: the product page has a
        // brand+style fallback (`parseSlugForLookup` → ilike on
        // products table) that can still resolve. Fall through to
        // the HTTP probe so we don't get false positives the other
        // direction.
      } catch {
        // Supabase down or query threw — fall through to HTTP.
      }
    }
  }

  // B) HTTP probe for everything else.
  //
  // 8s timeout (up from 5s): the original product page render can take
  // 5–10 s on a cold cache because it fans out to SS Activewear for
  // comparable / companion lookups. The product fast path above sidesteps
  // most of that, but the bump gives static pages a healthy margin too.
  try {
    const res = await fetch(`${origin}${path}`, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      headers: {
        'x-internal-verify': '1',
        'user-agent': 'GarmentDecor/UnresolvedQueueVerifier',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 200) return false;
    if (res.status >= 300 && res.status < 400) return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * Verify rows in batches so we don't fan out 200 concurrent fetches when
 * the queue is large. Concurrency 10 keeps the admin page responsive
 * (~1s for 100 rows) without thrashing the serverless function pool.
 */
async function filterStill404Rows(
  origin: string,
  rows: NotFoundPathDbRow[],
  concurrency = 10,
): Promise<NotFoundPathDbRow[]> {
  const kept: NotFoundPathDbRow[] = [];
  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    const checked = await Promise.all(
      batch.map(async (r) => ({ row: r, keep: await verifyStill404(origin, r.path) })),
    );
    for (const { row, keep } of checked) {
      if (keep) kept.push(row);
    }
  }
  return kept;
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

  // First pass — drop blocklisted prefixes (admin/dashboard/auth/etc.).
  // These are also blocked at write time in
  // lib/slug-redirects.ts::logNotFoundSlug; this only matters for rows
  // that were logged before the blocklist existed.
  const candidates = ((data ?? []) as NotFoundPathDbRow[]).filter(
    (r) => !isBlocklistedPath(r.path),
  );

  // Second pass — verify each remaining row is STILL a 404 right now.
  // A row written during a transient cache miss (cold product cache,
  // brief Vercel edge propagation gap, etc.) becomes a false positive
  // the moment the underlying page starts resolving again. We don't
  // delete the DB row — just hide it from the queue. If the path
  // re-breaks later, the next real visitor will re-bump it and it
  // reappears here naturally.
  //
  // `request.nextUrl.origin` resolves to the current deployment URL
  // (https://yoursite on Vercel, http://localhost:3000 in dev), so
  // self-probing works in both environments without extra config.
  const verified = await filterStill404Rows(request.nextUrl.origin, candidates);

  return NextResponse.json({ paths: verified });
}

/**
 * PATCH /api/admin/not-found-slugs
 * Admin actions on one OR many unresolved paths. Currently supported:
 *
 *   { path: '/services/old-name', action: 'ignore' }
 *     → single-path form (legacy, still accepted)
 *
 *   { paths: ['/foo', '/bar', '/baz'], action: 'ignore' }
 *     → bulk form. All listed paths are marked resolved in one DB UPDATE
 *       and a single audit-log entry is written summarizing the batch.
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
    paths?: unknown;
    action?: string;
  };

  if (body.action !== 'ignore') {
    return NextResponse.json(
      { error: "Supported actions: 'ignore'" },
      { status: 400 },
    );
  }

  // Collect inputs. Accept either single `path` or array `paths`. Normalize
  // every entry and drop blanks so we can rely on a clean array downstream.
  const rawList: string[] = Array.isArray(body.paths)
    ? (body.paths as unknown[]).filter((x): x is string => typeof x === 'string')
    : typeof body.path === 'string'
      ? [body.path]
      : [];

  const normalized = Array.from(
    new Set(rawList.map((p) => normalizePath(p)).filter((p) => p.length > 0)),
  );

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: 'path or paths is required' },
      { status: 400 },
    );
  }
  if (normalized.length > MAX_BULK) {
    return NextResponse.json(
      { error: `Too many paths in one request (max ${MAX_BULK})` },
      { status: 400 },
    );
  }

  const { user } = await getServerUser();

  // Single batched UPDATE via `.in()` is materially cheaper than a loop:
  // one round-trip and one row lock pass instead of N. Same payload as the
  // helper in lib/admin-redirects.ts::markNotFoundResolved.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerSupabaseClient() as any;
  const { error } = await supabase
    .from('not_found_slugs')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
      resolution_type: 'ignored',
      resolution_redirect_id: null,
    })
    .in('path', normalized);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // One audit entry per batch — both because the activity log is admin-
  // facing UI itself (we don't want it filled with 100 near-identical rows)
  // and because the user thinks of a bulk-ignore as one action.
  const summary =
    normalized.length === 1
      ? `ignored unresolved path ${normalized[0]}`
      : `ignored ${normalized.length} unresolved paths (bulk)`;

  await logAdminActivity(request, {
    action: 'slug_redirect.miss_ignored',
    resourceType: 'not_found_slug',
    resourceId: normalized.length === 1 ? normalized[0] : `bulk:${normalized.length}`,
    summary,
  });

  return NextResponse.json({ ok: true, count: normalized.length });
}
