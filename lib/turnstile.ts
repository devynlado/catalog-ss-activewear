/**
 * Cloudflare Turnstile server-side verification.
 *
 * Companion to the <TurnstileWidget> client component. Pair them like this:
 *
 *   1. Client renders <TurnstileWidget onTokenChange={setToken} /> in the
 *      form. When the user passes the challenge (usually invisibly), the
 *      widget hands us a token.
 *   2. Form submits the token alongside the form data.
 *   3. The API route calls verifyTurnstileToken(token, ip) before doing
 *      any real work.
 *
 * Failure-mode policy (the "fail open" decision):
 *   - If TURNSTILE_SECRET_KEY is unset (e.g. local dev, or the kill switch
 *     `TURNSTILE_DISABLED=true`) we skip verification entirely. The form
 *     proceeds normally, with a one-time console warning.
 *   - If Cloudflare's `siteverify` API is unreachable, slow (>3s), or
 *     returns 5xx, we LOG LOUDLY and return `{ success: true, fallback }`
 *     so the caller can decide what to do. Our caller always treats the
 *     fallback as "let it through" — same posture as the rate limiter.
 *   - If verification clearly fails (`success: false` from Cloudflare with
 *     a clean response), we return `{ success: false }` and the caller
 *     rejects the submission with 400.
 *
 * That sequence means: a bad day at Cloudflare can never take your contact
 * form offline. Honeypot + rate limiter + the existing blocked_emails
 * filter still run on every request as defense in depth.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SITEVERIFY_TIMEOUT_MS = 3_000;

function isDisabled(): boolean {
  if (process.env.TURNSTILE_DISABLED === 'true') return true;
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  return false;
}

let warnedAboutDisabled = false;
function warnDisabledOnce() {
  if (warnedAboutDisabled) return;
  warnedAboutDisabled = true;
  console.warn(
    '[turnstile] TURNSTILE_SECRET_KEY is not set (or TURNSTILE_DISABLED=true). Skipping all verification — every submitted token will be accepted. This is OK for local dev, NOT for production.'
  );
}

export interface TurnstileVerifyResult {
  /**
   * True when we believe the request is legitimate (passed CF's check OR
   * we failed open because of a transient error).
   */
  success: boolean;
  /**
   * Why we returned what we did. Useful for logging and for the call site
   * to decide whether to surface a user-facing error.
   *   - 'verified'     — Cloudflare said yes.
   *   - 'rejected'     — Cloudflare said no (real bot, expired token, etc.).
   *   - 'missing'      — No token in the request payload at all.
   *   - 'failed-open'  — Cloudflare unreachable / errored / timed out.
   *   - 'disabled'     — Verification is intentionally turned off (dev/kill switch).
   */
  reason: 'verified' | 'rejected' | 'missing' | 'failed-open' | 'disabled';
  /** Cloudflare's error codes when reason='rejected', for diagnostics. */
  errorCodes?: readonly string[];
}

/**
 * Verify a Turnstile token issued client-side. Always resolves; never throws.
 *
 * @param token - The value from cf-turnstile-response, sent by the client.
 * @param ip    - Optional client IP (helps Cloudflare's risk scoring). Pass
 *                the same value `getClientIp()` returned in your route.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip?: string
): Promise<TurnstileVerifyResult> {
  if (isDisabled()) {
    warnDisabledOnce();
    return { success: true, reason: 'disabled' };
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { success: false, reason: 'missing' };
  }

  // Cloudflare expects application/x-www-form-urlencoded for siteverify.
  const params = new URLSearchParams();
  params.set('secret', process.env.TURNSTILE_SECRET_KEY!);
  params.set('response', token);
  if (ip) params.set('remoteip', ip);

  // Manual timeout: AbortController + setTimeout. We can't trust the
  // platform's default fetch timeout (Vercel's edge runtime is generous;
  // Node runtime doesn't time out at all). 3s is plenty under normal load.
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), SITEVERIFY_TIMEOUT_MS);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: params,
      signal: controller.signal,
      // Don't cache verification — every token is single-use and Cloudflare
      // already de-dupes server side.
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(
        `[turnstile] siteverify returned ${res.status}; failing open. ip=${ip ?? 'unknown'}`
      );
      return { success: true, reason: 'failed-open' };
    }

    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    if (data.success) {
      return { success: true, reason: 'verified' };
    }

    // Cloudflare gave a clean "no". This is the bot path.
    return {
      success: false,
      reason: 'rejected',
      errorCodes: data['error-codes'] ?? [],
    };
  } catch (err) {
    // AbortError when we hit the 3s timeout, network errors otherwise.
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.warn(
      `[turnstile] siteverify ${isTimeout ? 'timed out' : 'errored'}; failing open. ip=${ip ?? 'unknown'}`,
      err
    );
    return { success: true, reason: 'failed-open' };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * Pull the Turnstile token out of a request body. Standardised here so
 * every API route uses the same field name.
 *
 * The form name `cf-turnstile-response` matches the input that the
 * Turnstile JS widget injects automatically when you set the form's id;
 * for our React forms we read it out of state and put it in JSON under
 * the same key for consistency.
 */
export const TURNSTILE_TOKEN_FIELD = 'cf-turnstile-response' as const;

export function readTurnstileToken(
  body: Record<string, unknown> | null | undefined
): string | null {
  if (!body || typeof body !== 'object') return null;
  const value = (body as Record<string, unknown>)[TURNSTILE_TOKEN_FIELD];
  return typeof value === 'string' ? value : null;
}
