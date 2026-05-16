/**
 * URL redirect engine (formerly: slug redirect engine).
 *
 * Centralized in `app/not-found.tsx` so it fires whenever Next.js is
 * about to render a 404 — regardless of which segment the request was
 * routed to. That gives us one runtime hook for product pages, services,
 * blog posts, project pages, marketing URLs, and anything we add later.
 *
 * Responsibilities:
 *
 *   1. Look up an active redirect row keyed by `from_path` (full
 *      site-relative path, e.g. `/product/heavyweight-tee` or
 *      `/services/screen-printing-near-me`).
 *   2. Lazily promote 302 → 301 when `promote_to_301_at` has passed.
 *   3. Resolve the redirect's target into a `{ url, statusCode }` pair,
 *      or `null` for `gone` / unhealthy targets (so the page falls
 *      through to the standard 404 UI).
 *   4. Fire-and-forget bump `hits` and `last_hit_at`.
 *   5. When no redirect exists, fire-and-forget log to `not_found_slugs`,
 *      filtering bots by user-agent AND filtering obvious attack/junk
 *      patterns by path so the admin queue stays actionable.
 *
 * Every database call uses the service-role client so this works for
 * anonymous visitors without needing an RLS policy on the public side.
 */

import { createServerSupabaseClient } from './supabase';
import { getProductByStyleId } from './product-cache';
import type { Product } from './types';

/**
 * A target product is "displayable" if it is in our catalog AND not
 * hidden. Mirrors `isProductUnavailable` in app/product/[slug]/page.tsx
 * but inverted; we keep the logic local to avoid a cross-import.
 */
function isProductDisplayable(product: Product): boolean {
  return product.isActive !== false && product.manuallyHidden !== true;
}

export type SlugRedirectTargetType = 'product' | 'category' | 'gone';

export interface ResolvedRedirect {
  /** The URL we should redirect the visitor to. */
  url: string;
  /** HTTP status code to use (301 / 302 / 307). */
  statusCode: 301 | 302 | 307;
  /** Underlying redirect row id (for analytics / debugging). */
  redirectId: string;
}

interface RawRedirectRow {
  id: string;
  from_path: string;
  target_type: SlugRedirectTargetType;
  to_product_id: number | null;
  to_url: string | null;
  status_code: number;
  promote_to_301_at: string | null;
  is_active: boolean;
}

/**
 * Normalize an incoming path to the form we store in the DB.
 *
 *   - leading slash required (added if missing)
 *   - lowercased
 *   - trailing slash stripped (except the root, which is never stored)
 *   - query string / hash stripped
 *   - URL-encoded sequences decoded (so `/services/screen%20printing`
 *     and `/services/screen printing` match the same row)
 *
 * Returns `''` for inputs that don't represent a meaningful path
 * (empty, just `/`, decode failure). Callers should treat empty as "no
 * lookup possible" and short-circuit.
 */
export function normalizePath(input: string | null | undefined): string {
  if (!input) return '';
  let raw = String(input).trim();
  if (!raw) return '';

  // Strip query string and hash before normalizing.
  const hashIdx = raw.indexOf('#');
  if (hashIdx >= 0) raw = raw.slice(0, hashIdx);
  const queryIdx = raw.indexOf('?');
  if (queryIdx >= 0) raw = raw.slice(0, queryIdx);

  // Best-effort percent-decoding. Bad escapes leave the path as-is.
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // ignore — keep raw
  }

  raw = raw.toLowerCase();

  // Force exactly one leading slash. We accept inputs both with and
  // without it so admins can paste either form.
  if (!raw.startsWith('/')) raw = '/' + raw;
  raw = raw.replace(/^\/+/, '/');

  // Strip trailing slash for everything except the root, then refuse
  // the root entirely (can't redirect from `/` via this mechanism).
  if (raw.length > 1) raw = raw.replace(/\/+$/, '');
  if (raw === '/' || raw === '') return '';

  // Collapse internal duplicate slashes (`/foo//bar` → `/foo/bar`).
  raw = raw.replace(/\/{2,}/g, '/');

  return raw;
}

/**
 * Pattern list of user-agent substrings (case-insensitive) that we treat
 * as bots. Conservative: misses on real users are fine here because the
 * cost is only "this miss shows up in the admin queue."
 */
const BOT_UA_PATTERNS = [
  'bot', 'crawler', 'spider', 'scrap', 'fetch', 'monitor',
  'curl', 'wget', 'axios', 'python-requests', 'go-http-client',
  'java/', 'node-fetch', 'postmanruntime',
  'slackbot', 'discordbot', 'twitterbot', 'facebookexternalhit',
  'linkedinbot', 'bingbot', 'googlebot', 'applebot', 'duckduckbot',
  'yandexbot', 'baiduspider', 'mj12bot', 'ahrefsbot', 'semrushbot',
  'archive.org_bot', 'redditbot', 'whatsapp', 'telegrambot',
  'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom', 'uptimerobot',
  'headlesschrome',
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pat) => ua.includes(pat));
}

/**
 * Path-based junk filter. Drops obvious attack/scan patterns BEFORE
 * they reach the unresolved-slugs queue.
 *
 * Now that we log 404s for any URL (not just /product/...), the queue
 * sees scans for WordPress paths, env files, git internals, ASP/PHP
 * probes, etc. Without this filter the queue becomes unusable within a
 * day.
 *
 * Returns `true` if the path should be ignored entirely (do not log,
 * do not surface). False otherwise.
 */
export function isBlocklistedPath(path: string): boolean {
  if (!path) return true;
  const p = path.toLowerCase();

  // Filename-extension probes for stacks we don't run.
  if (/\.(php|aspx?|jsp|cgi|pl|cfm|exe|sql|bak|env|ini|conf|yml|yaml|log|swp)(\/|$|\?)/.test(p)) {
    return true;
  }

  // Sensitive dotfile / dotdir paths.
  if (/(^|\/)\.(git|env|aws|ssh|htaccess|htpasswd|svn|hg|DS_Store)/.test(p)) {
    return true;
  }

  // CMS / admin-panel scans for software we don't run.
  const junkSubstrings = [
    'wp-admin', 'wp-content', 'wp-includes', 'wp-login',
    'wp-config', 'xmlrpc', 'phpmyadmin', 'pma/',
    'administrator/', 'wp-json', 'mysql', 'cpanel',
    'webmail', 'roundcube', 'phpinfo',
  ];
  if (junkSubstrings.some((s) => p.includes(s))) return true;

  // Next/Vercel internals and well-known files we shouldn't track.
  if (
    p.startsWith('/_next/') ||
    p.startsWith('/_vercel/') ||
    p.startsWith('/.well-known/') ||
    p === '/favicon.ico' ||
    p === '/robots.txt' ||
    p === '/sitemap.xml'
  ) {
    return true;
  }

  return false;
}

/**
 * Extract the product slug from a path like `/product/heavyweight-tee`.
 * Returns the bare slug (no leading slash, no `product/` prefix) or
 * empty string if the path is not a product path. Used only by the
 * suggestion engine (which is product-specific) — keep general
 * `normalizePath` for everything else.
 */
export function extractProductSlug(path: string): string {
  const norm = normalizePath(path);
  if (!norm.startsWith('/product/')) return '';
  return norm.slice('/product/'.length);
}

/**
 * Merge an incoming query string onto a redirect target URL so the
 * caller's UTM/etc. parameters survive the redirect.
 *
 * `incoming` may be a raw search string (with or without leading `?`)
 * or a `URLSearchParams`. Behavior:
 *   - if the target already has a query, incoming keys NEVER overwrite
 *     it (admin-defined params win)
 *   - if neither has params, the target URL is returned as-is
 */
export function buildRedirectUrl(
  targetUrl: string,
  incoming: string | URLSearchParams | null | undefined,
): string {
  const incomingParams =
    incoming instanceof URLSearchParams
      ? incoming
      : new URLSearchParams(typeof incoming === 'string' ? incoming.replace(/^\?/, '') : '');

  if ([...incomingParams.keys()].length === 0) return targetUrl;

  const [path, existingQuery] = targetUrl.split('?');
  const merged = new URLSearchParams(existingQuery ?? '');
  for (const [key, value] of incomingParams) {
    if (!merged.has(key)) merged.set(key, value);
  }
  const out = merged.toString();
  return out ? `${path}?${out}` : path;
}

/**
 * Look up an active redirect for the given pathname.
 *
 * Returns `null` when:
 *   - No row matches.
 *   - The matching row is inactive.
 *   - The target is `gone`.
 *   - The target is `product` but the product is no longer displayable
 *     (manually_hidden, inactive, or missing from cache).
 *
 * Side effects (all fire-and-forget, do not block the response):
 *   - Promote `status_code` 302 → 301 if the window has passed.
 *   - Increment `hits` and bump `last_hit_at`.
 */
export async function lookupRedirect(pathname: string): Promise<ResolvedRedirect | null> {
  const normalized = normalizePath(pathname);
  if (!normalized) return null;

  let row: RawRedirectRow | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerSupabaseClient() as any;
    const { data, error } = await supabase
      .from('slug_redirects')
      .select(
        'id, from_path, target_type, to_product_id, to_url, status_code, promote_to_301_at, is_active'
      )
      .eq('from_path', normalized)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn('[slug-redirects] lookup error:', error.message);
      return null;
    }
    row = (data as RawRedirectRow | null) ?? null;
  } catch (err) {
    console.warn('[slug-redirects] lookup threw:', err);
    return null;
  }

  if (!row) return null;

  // Resolve target → URL.
  let url: string | null = null;
  if (row.target_type === 'gone') {
    return null; // falls through to notFound() in the page
  } else if (row.target_type === 'category') {
    url = row.to_url;
  } else if (row.target_type === 'product') {
    if (row.to_product_id == null) return null;
    try {
      const product = await getProductByStyleId(row.to_product_id);
      if (!product || !isProductDisplayable(product)) {
        // Target became hidden/discontinued. Don't redirect to a dead page;
        // let the source path 404 until an admin reconfigures.
        return null;
      }
      url = `/product/${product.slug}`;
    } catch (err) {
      console.warn('[slug-redirects] product target resolve failed:', err);
      return null;
    }
  }

  if (!url) return null;

  // Lazy promotion: 302 → 301 once the promotion window has passed.
  let effectiveStatus = row.status_code;
  const shouldPromote =
    row.status_code === 302 &&
    row.promote_to_301_at != null &&
    new Date(row.promote_to_301_at).getTime() <= Date.now();

  if (shouldPromote) {
    effectiveStatus = 301;
    void promoteRedirect(row.id);
  }

  // Fire-and-forget hit tracking. Failures are logged but never thrown.
  void bumpHit(row.id);

  if (effectiveStatus !== 301 && effectiveStatus !== 302 && effectiveStatus !== 307) {
    effectiveStatus = 302;
  }

  return {
    url,
    statusCode: effectiveStatus as 301 | 302 | 307,
    redirectId: row.id,
  };
}

async function bumpHit(redirectId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerSupabaseClient() as any;
    // Optimistic SELECT-then-UPDATE. Can lose a count under high
    // concurrency, which is acceptable for an admin-facing counter.
    const { data } = await supabase
      .from('slug_redirects')
      .select('hits')
      .eq('id', redirectId)
      .single();
    const next = ((data?.hits as number | undefined) ?? 0) + 1;
    await supabase
      .from('slug_redirects')
      .update({ hits: next, last_hit_at: new Date().toISOString() })
      .eq('id', redirectId);
  } catch (err) {
    console.warn('[slug-redirects] bumpHit failed:', err);
  }
}

async function promoteRedirect(redirectId: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerSupabaseClient() as any;
    await supabase
      .from('slug_redirects')
      .update({ status_code: 301 })
      .eq('id', redirectId)
      .eq('status_code', 302); // idempotent guard
    // Audit the promotion. We have no actor here (automated), so we write
    // a row with NULL changed_by and a synthetic actor name.
    await supabase
      .from('slug_redirect_history')
      .insert({
        redirect_id: redirectId,
        from_path: '',
        action: 'promoted',
        snapshot: { status_code: 301, reason: 'auto_promote_window_passed' },
        changed_by_name: 'system (auto-promote)',
      });
  } catch (err) {
    console.warn('[slug-redirects] promoteRedirect failed:', err);
  }
}

/**
 * Log a 404 path to the `not_found_slugs` queue.
 *
 * Idempotent: bumps `hits` and `last_seen` on existing rows. Filters
 * obvious attack/scan paths via `isBlocklistedPath` BEFORE the DB hit so
 * the queue stays actionable, and tags by user-agent so bot scans don't
 * clutter the queue surface.
 *
 * Truly fire-and-forget: never throws, never blocks the caller.
 */
export async function logNotFoundSlug(
  path: string,
  options: {
    userAgent?: string | null;
    referrer?: string | null;
  } = {}
): Promise<void> {
  try {
    const normalized = normalizePath(path);
    if (!normalized || normalized.length > 500) return;
    if (isBlocklistedPath(normalized)) return;

    const isBot = isBotUserAgent(options.userAgent);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerSupabaseClient() as any;

    // Upsert pattern: try update first; if no row, insert.
    const { data: existing } = await supabase
      .from('not_found_slugs')
      .select('path, hits, resolved')
      .eq('path', normalized)
      .maybeSingle();

    if (existing) {
      // Don't re-open resolved rows; just bump the counter.
      await supabase
        .from('not_found_slugs')
        .update({
          hits: ((existing.hits as number | undefined) ?? 0) + 1,
          last_seen: new Date().toISOString(),
          last_referrer: options.referrer ?? null,
          last_user_agent: options.userAgent ?? null,
          // is_bot is sticky: once any human hit lands it stays human.
          ...(isBot ? {} : { is_bot: false }),
        })
        .eq('path', normalized);
    } else {
      await supabase.from('not_found_slugs').insert({
        path: normalized,
        hits: 1,
        is_bot: isBot,
        last_referrer: options.referrer ?? null,
        last_user_agent: options.userAgent ?? null,
      });
    }
  } catch (err) {
    console.warn('[slug-redirects] logNotFoundSlug failed:', err);
  }
}

/**
 * Default auto-promotion window for new manually-created redirects.
 * Admins can override per-row in the create form.
 */
export const DEFAULT_PROMOTE_DAYS = 14;

/** Helper: compute promote_to_301_at given a day count, or null to disable. */
export function computePromoteAt(daysFromNow: number | null): string | null {
  if (daysFromNow === null) return null;
  if (!Number.isFinite(daysFromNow) || daysFromNow < 0) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + Math.floor(daysFromNow));
  return d.toISOString();
}
