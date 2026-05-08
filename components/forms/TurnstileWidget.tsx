'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Script from 'next/script';

/**
 * Cloudflare Turnstile widget.
 *
 * Behaviour:
 *   - Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (local dev,
 *     or kill switch). Calls onTokenChange('') exactly once so the parent
 *     form treats the empty token as "no challenge required" and submits
 *     normally. The server-side verifier mirrors this behaviour and skips
 *     verification when its secret is missing.
 *   - Loads Cloudflare's script asynchronously via next/script. While the
 *     script is loading, the parent form's submit button should be disabled
 *     by checking `token === null`.
 *   - When the user passes the challenge (usually invisibly), Cloudflare
 *     calls our success callback with a fresh token. We forward it to the
 *     parent via `onTokenChange`.
 *   - When a token expires (~5 min) or the challenge errors, we reset the
 *     widget so the user gets a new token if they're still on the page.
 *
 * Failure mode: if Cloudflare's script fails to load entirely (network
 * outage, ad-blocker, etc.) the widget never renders and we never call
 * `onTokenChange`. The parent's `token` state stays `null`. Whether to
 * block submit on `null` is a parent-form decision — see `TurnstileGate`
 * below for a small helper that handles the common case.
 *
 * We deliberately use the explicit JS API (`window.turnstile.render`)
 * rather than the auto-init `<div class="cf-turnstile">` markup, because
 * we need fine-grained control over reset/expire callbacks and we don't
 * want Turnstile to hijack form submission.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'invisible' | 'flexible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          action?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  /**
   * Called with the token whenever it changes. The callback receives:
   *   - A non-empty string when verification succeeds. Pass this to your
   *     API.
   *   - An empty string `''` when Turnstile is disabled site-wide (no env
   *     key). Treat this as "no token needed."
   *   - `null` when verification expired/errored and a new token is being
   *     generated. The parent should disable submit until a string arrives.
   */
  onTokenChange: (token: string | null | '') => void;
  /**
   * Optional `action` label (Cloudflare uses this to segment analytics
   * across forms). Recommended: `contact`, `quote`, etc.
   */
  action?: string;
  /**
   * Theme override. Defaults to 'auto' which matches the user's OS
   * preference. Pass 'light' on dark-themed marketing pages where the
   * default would clash.
   */
  theme?: 'light' | 'dark' | 'auto';
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function TurnstileWidget({
  onTokenChange,
  action,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  // Stable id used as a CSS selector when window.turnstile.render fires.
  const containerId = useId();

  // Tell the parent immediately when we're disabled. Effect runs once on
  // mount so the initial submit button state is correct.
  useEffect(() => {
    if (!siteKey) {
      onTokenChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  const handleSuccess = useCallback(
    (token: string) => {
      onTokenChange(token);
    },
    [onTokenChange]
  );

  const handleExpired = useCallback(() => {
    // Token expired — null it out and let Turnstile mint a fresh one.
    onTokenChange(null);
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange]);

  const handleError = useCallback(() => {
    console.warn('[turnstile] widget error; resetting');
    onTokenChange(null);
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange]);

  // Render the widget once the script is loaded and we have a site key.
  useEffect(() => {
    if (!siteKey || !scriptLoaded || !containerRef.current) return;
    if (!window.turnstile) return;
    if (widgetIdRef.current) return; // already rendered

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleSuccess,
        'error-callback': handleError,
        'expired-callback': handleExpired,
        theme,
        action,
      });
    } catch (err) {
      console.error('[turnstile] render failed:', err);
      onTokenChange(null);
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Best effort — ignore double-removes during HMR.
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, scriptLoaded, handleSuccess, handleError, handleExpired, theme, action, onTokenChange]);

  if (!siteKey) {
    // Disabled site-wide. Render nothing; we already told the parent the
    // token is empty in the effect above.
    return null;
  }

  return (
    <>
      <Script
        src={SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          console.warn('[turnstile] script failed to load');
          // Token stays null — parent form will block submit until either
          // the script loads or the user falls back (e.g. clicks a "use
          // phone instead" link). Acceptable degraded UX.
        }}
      />
      <div ref={containerRef} id={containerId} />
    </>
  );
}
