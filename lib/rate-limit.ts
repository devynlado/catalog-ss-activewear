/**
 * Rate limiting helper backed by Upstash Redis.
 *
 * Design goals (in priority order):
 *
 *  1. Never break the site. If Upstash is down, slow, or unconfigured we
 *     FAIL OPEN — the request is allowed through and we log loudly. A
 *     credential-stuffing attacker getting through during a Redis outage is
 *     less bad than legitimate customers seeing the contact form go offline.
 *
 *  2. Cheap. Each `check()` is one or two Redis commands. With the limits
 *     we set on call sites and the site's current traffic, we use ~3% of
 *     Upstash's free 10k commands/day quota.
 *
 *  3. Tunable per endpoint. Each call site picks a tag, a window, and a
 *     limit. The composite cache key is `tag:identifier`, where the
 *     identifier is usually `ip` or `ip:email` so a brute-force run against
 *     one account doesn't lock out a colleague behind the same IP.
 *
 *  4. Reversible. Setting `RATE_LIMIT_DISABLED=true` (or simply leaving the
 *     UPSTASH_* env vars unset) turns this whole module into a no-op without
 *     touching any call site. Useful for local dev and emergency rollback.
 */

import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// How long we'll wait for Upstash before giving up and failing open. Keep
// this short — the whole point is that a bad Redis day cannot stall user
// requests. ~200ms is generous; typical responses are 10-50ms.
const REDIS_TIMEOUT_MS = 200;

// We intentionally cache the Redis + Ratelimit instances at module scope so
// repeated requests on a warm Lambda reuse the same TCP connection.
let cachedRedis: Redis | null = null;
const cachedLimiters = new Map<string, Ratelimit>();

function isDisabled(): boolean {
  if (process.env.RATE_LIMIT_DISABLED === 'true') return true;
  // Treat missing credentials as "disabled" rather than throwing. Local dev
  // and preview deploys without Upstash configured will simply skip rate
  // limiting; production is expected to set the vars.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return true;
  }
  return false;
}

function getRedis(): Redis | null {
  if (isDisabled()) return null;
  if (cachedRedis) return cachedRedis;
  try {
    cachedRedis = Redis.fromEnv();
    return cachedRedis;
  } catch (err) {
    console.error('[rate-limit] Failed to initialize Upstash Redis client:', err);
    return null;
  }
}

export interface RateLimitOptions {
  /**
   * Short identifier baked into the Redis key, e.g. `admin-auth` or
   * `contact-form`. Pick a stable value per endpoint — changing it resets
   * everyone's counter.
   */
  tag: string;
  /** Max number of allowed requests in the window. */
  limit: number;
  /**
   * Window length in seconds. Examples:
   *   60      = 1 min
   *   600     = 10 min
   *   900     = 15 min
   *   86400   = 1 day
   */
  windowSeconds: number;
}

function getLimiter(opts: RateLimitOptions): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${opts.tag}:${opts.limit}:${opts.windowSeconds}`;
  const cached = cachedLimiters.get(cacheKey);
  if (cached) return cached;

  // Sliding window is the right primitive here: it amortizes burst limits
  // across the window edges so users don't see surprising "Too many" errors
  // right at minute boundaries.
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSeconds} s`),
    analytics: false,
    prefix: `rl:${opts.tag}`,
  });
  cachedLimiters.set(cacheKey, limiter);
  return limiter;
}

export interface RateLimitDecision {
  /** True when the request is allowed. False means return HTTP 429. */
  success: boolean;
  /** How many requests the caller still has in this window. */
  remaining: number;
  /** Total requests allowed in the window (echo of opts.limit). */
  limit: number;
  /** Unix-ms timestamp when the current window resets. */
  reset: number;
  /** Seconds until reset — convenience for the `Retry-After` header. */
  retryAfterSeconds: number;
  /**
   * `'limited'` — Redis said no.
   * `'allowed'` — Redis said yes.
   * `'failed-open'` — Redis errored / timed out / is unconfigured. We let
   *   the request through but the call site may want to log.
   */
  reason: 'allowed' | 'limited' | 'failed-open';
}

const FAILED_OPEN: Omit<RateLimitDecision, 'limit'> = {
  success: true,
  remaining: 1,
  reset: Date.now() + 60_000,
  retryAfterSeconds: 0,
  reason: 'failed-open',
};

/**
 * Check a request against a rate-limit bucket.
 *
 * @param identifier - The thing being limited. Usually IP, sometimes
 *   `ip:email` or `userId`. Keep it stable per actor.
 * @param opts - Endpoint-specific config (see RateLimitOptions).
 *
 * Always resolves; never throws. Errors fail open and are logged.
 */
export async function checkRateLimit(
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitDecision> {
  const limiter = getLimiter(opts);
  if (!limiter) {
    return { ...FAILED_OPEN, limit: opts.limit };
  }

  // Race the Redis call against a hard timeout so a slow Upstash response
  // can never stall the user-facing request.
  const limitPromise = limiter
    .limit(identifier)
    .then((res) => ({ kind: 'ok' as const, res }))
    .catch((err) => ({ kind: 'err' as const, err }));

  const timeoutPromise = new Promise<{ kind: 'timeout' }>((resolve) =>
    setTimeout(() => resolve({ kind: 'timeout' }), REDIS_TIMEOUT_MS)
  );

  const outcome = await Promise.race([limitPromise, timeoutPromise]);

  if (outcome.kind === 'timeout') {
    console.warn(
      `[rate-limit] Upstash timeout (>${REDIS_TIMEOUT_MS}ms) for tag=${opts.tag} id=${identifier}; failing open`
    );
    return { ...FAILED_OPEN, limit: opts.limit };
  }
  if (outcome.kind === 'err') {
    console.error(
      `[rate-limit] Upstash error for tag=${opts.tag} id=${identifier}; failing open`,
      outcome.err
    );
    return { ...FAILED_OPEN, limit: opts.limit };
  }

  const { res } = outcome;
  const reset = res.reset;
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return {
    success: res.success,
    remaining: res.remaining,
    limit: res.limit,
    reset,
    retryAfterSeconds,
    reason: res.success ? 'allowed' : 'limited',
  };
}

/**
 * Extract the client IP from a Next.js request, handling the usual proxy
 * chain. Order matters:
 *
 *   1. `cf-connecting-ip`  — set by Cloudflare. If we ever sit behind CF
 *      this is the only header we should trust.
 *   2. `x-real-ip`         — Vercel sets this reliably.
 *   3. `x-forwarded-for`   — first hop in the comma-separated chain.
 *
 * We deliberately do NOT trust the last hop in `x-forwarded-for`: that's
 * the inside of the proxy and would let any client spoof their IP by
 * sending a forged header.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const real = headers.get('x-real-ip');
  if (real) return real.trim();

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    // Format: "client, proxy1, proxy2". The leftmost entry is the original
    // client (per RFC 7239). Subsequent entries are progressively closer to
    // us and are easier to spoof; we ignore them.
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  // Last-resort fallback. We use a sentinel string instead of an empty
  // identifier so all unknown-IP requests share a single rate-limit bucket
  // (otherwise a missing header would mean unlimited requests).
  return '0.0.0.0';
}

/**
 * Build standard 429 response headers. Useful for both API responses and
 * any future middleware integration.
 */
export function buildRateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(Math.max(0, decision.remaining)),
    'X-RateLimit-Reset': String(decision.reset),
    'Retry-After': String(Math.max(1, decision.retryAfterSeconds)),
  };
}

/**
 * Format a human-readable "try again in X" string for error UIs.
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds <= 1) return 'a moment';
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'}`;
  const hrs = Math.ceil(mins / 60);
  return `${hrs} hour${hrs === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------------------
// Endpoint configs.
//
// Centralised so we have one place to tweak limits. All values reflect the
// agreement in the security plan discussion (May 8, 2026):
//   * Generous on admin auth (one admin, one strong password — fat-finger
//     forgiveness matters more than brute-force speed since 12+ char
//     passwords are uncrackable in any realistic time anyway).
//   * Tight on public form submissions (real customers submit once or twice;
//     anything more is spam).
// ---------------------------------------------------------------------------

export const RATE_LIMITS = {
  /** Legacy admin password endpoint. 10 attempts per IP+email per 15 min. */
  adminAuth: { tag: 'admin-auth', limit: 10, windowSeconds: 15 * 60 } satisfies RateLimitOptions,

  /** Contact form per-IP short window. */
  contactBurst: { tag: 'contact-burst', limit: 5, windowSeconds: 10 * 60 } satisfies RateLimitOptions,
  /** Contact form per-IP daily cap. Catches slow drip spammers. */
  contactDaily: { tag: 'contact-daily', limit: 20, windowSeconds: 24 * 60 * 60 } satisfies RateLimitOptions,

  /** Quote form per-IP short window. */
  quoteBurst: { tag: 'quote-burst', limit: 5, windowSeconds: 10 * 60 } satisfies RateLimitOptions,
  /** Quote form per-IP daily cap. */
  quoteDaily: { tag: 'quote-daily', limit: 20, windowSeconds: 24 * 60 * 60 } satisfies RateLimitOptions,

  /**
   * Audit beacons fired by the login page after a successful auth. These
   * are background pings, not user-driven actions, so we set them just
   * tight enough to prevent log flooding by abusive clients.
   */
  auditBeacon: { tag: 'audit-beacon', limit: 60, windowSeconds: 60 } satisfies RateLimitOptions,
} as const;
