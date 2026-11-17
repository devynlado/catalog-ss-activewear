'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * LiveChat.com widget (public-facing sales live chat).
 *
 * This is intentionally SEPARATE from the Supabase-backed "customer chat"
 * (`CustomerChatWidget`), which only renders on authenticated /orders pages.
 *
 * To avoid two chat bubbles stacking in the bottom-right corner — and because
 * we never want this third-party script running inside internal/authenticated
 * areas — the widget is only injected on public routes. On the excluded routes
 * below the LiveChat tracking script is NOT loaded at all (direct visits), and
 * if the visitor navigates into an excluded area client-side, the already-loaded
 * widget is fully `destroy`ed (not merely hidden), then re-initialised cleanly
 * when they return to a public route.
 */

// LiveChat license id. Public by design (it ships in the client snippet), so a
// hardcoded fallback is safe; override per-environment via Vercel if needed.
const LICENSE = process.env.NEXT_PUBLIC_LIVECHAT_LICENSE || '13425756';

// Route prefixes where live chat must NOT run (customer-chat / internal / auth
// areas). `/cart` is intentionally NOT excluded — live chat shows there.
const EXCLUDED_PREFIXES = [
  '/orders',
  '/dashboard',
  '/admin',
  '/studio',
  '/checkout',
  '/login',
  '/signup',
];

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __lc?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LiveChatWidget?: any;
  }
}

function injectLiveChat() {
  // Clean any previous tracking script + widget object so re-init (after a
  // `destroy`) starts from a clean slate and we never double-load tracking.js.
  document
    .querySelectorAll('script[src*="cdn.livechatinc.com"]')
    .forEach((s) => s.remove());
  try {
    delete window.LiveChatWidget;
  } catch {
    window.LiveChatWidget = undefined;
  }

  window.__lc = {
    license: Number(LICENSE),
    integration_name: 'manual_channels',
    product_name: 'livechat',
  };

  /* eslint-disable */
  // Official LiveChat async loader (vendor snippet — do not reformat).
  ;(function (n: any, t: any, c: any) {
    function i(n: any) {
      return e._h ? e._h.apply(null, n) : e._q.push(n);
    }
    var e: any = {
      _q: [],
      _h: null,
      _v: '2.0',
      on: function () {
        i(['on', c.call(arguments)]);
      },
      once: function () {
        i(['once', c.call(arguments)]);
      },
      off: function () {
        i(['off', c.call(arguments)]);
      },
      get: function () {
        if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
        return i(['get', c.call(arguments)]);
      },
      call: function () {
        i(['call', c.call(arguments)]);
      },
      init: function () {
        var n = t.createElement('script');
        n.async = !0;
        n.type = 'text/javascript';
        n.src = 'https://cdn.livechatinc.com/tracking.js';
        t.head.appendChild(n);
      },
    };
    !n.__lc.asyncInit && e.init();
    n.LiveChatWidget = n.LiveChatWidget || e;
  })(window, document, [].slice);
  /* eslint-enable */
}

export function LiveChatWidget() {
  const pathname = usePathname();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!LICENSE) return;

    if (isExcludedPath(pathname)) {
      // Fully tear the widget down if it was loaded earlier this session.
      if (loadedRef.current) {
        try {
          window.LiveChatWidget?.call?.('destroy');
        } catch {
          /* no-op */
        }
        loadedRef.current = false;
      }
      return;
    }

    // Public route: inject once (or re-inject cleanly after a prior destroy).
    if (!loadedRef.current) {
      injectLiveChat();
      loadedRef.current = true;
    }
  }, [pathname]);

  return null;
}
