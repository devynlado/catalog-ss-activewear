import Link from 'next/link';
import { headers } from 'next/headers';
import { permanentRedirect, redirect } from 'next/navigation';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  lookupRedirect,
  logNotFoundSlug,
  buildRedirectUrl,
} from '@/lib/slug-redirects';

/**
 * Global 404 handler.
 *
 * Fires whenever Next.js is about to render a not-found state — whether
 * because no route matched or because a page called `notFound()`. We use
 * this as the single runtime hook for the URL-redirect system:
 *
 *   1. Look up the requested path in the `slug_redirects` table.
 *   2. If a row exists and resolves, redirect (301 / 302 / 307).
 *   3. Otherwise, log the miss to `not_found_slugs` so an admin can
 *      triage it, and render the standard 404 UI.
 *
 * The pathname + query string are read from request headers that
 * middleware.ts injects (`x-invoke-path` / `x-invoke-search`). Next.js
 * does not pass `params` / `searchParams` to a not-found component, so
 * this header round-trip is the simplest way to know what URL the
 * visitor actually requested.
 *
 * Performance note: this runs ONLY on the 404 path. Real pages render
 * without a single extra DB query. The redirect lookup adds one Supabase
 * roundtrip on misses, which is invisible against the rest of the 404
 * render cost.
 */
export default async function NotFound() {
  const hdrs = await headers();
  const pathname = hdrs.get('x-invoke-path') || '';
  const search = hdrs.get('x-invoke-search') || '';

  if (pathname) {
    // 1) Try the redirect table first. A hit short-circuits the 404 UI.
    //    Runs even for prefetch / verify probes so redirects work for both.
    const resolved = await lookupRedirect(pathname);
    if (resolved) {
      const target = buildRedirectUrl(resolved.url, search);
      // 301 → permanentRedirect (HTTP 308, SEO-equivalent to 301).
      // 302/307 → standard redirect (HTTP 307, SEO-equivalent to 302).
      if (resolved.statusCode === 301) {
        permanentRedirect(target);
      } else {
        redirect(target);
      }
    }

    // 2) Decide whether this 404 represents a real human-driven miss.
    //
    //    - Next.js prefetches every <Link> on the page server-side. If the
    //      product cache is cold or the SS Activewear API stutters during
    //      that prefetch, `getProduct` momentarily returns null and we end
    //      up here. The real user navigation a second later succeeds, but
    //      a row gets logged for a URL that resolves fine. The
    //      `Next-Router-Prefetch: 1` header is set ONLY for those
    //      background prefetches (not for real client navigations), so it
    //      is the cleanest signal to skip.
    //
    //    - The admin `Unresolved Paths` API verifies each queued row by
    //      probing the path with `x-internal-verify: 1`. We must not log
    //      those probes (would cause `hits` to climb every time an admin
    //      opens the queue) and must not show them as 200 either if the
    //      route really is missing.
    const isPrefetch = hdrs.get('next-router-prefetch') === '1';
    const isInternalVerify = hdrs.get('x-internal-verify') === '1';

    if (!isPrefetch && !isInternalVerify) {
      // Fire-and-forget; never blocks the response and never throws.
      void logNotFoundSlug(pathname, {
        userAgent: hdrs.get('user-agent'),
        referrer: hdrs.get('referer'),
      });
    }
  }

  // 3) Standard 404 UI.
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        <span className="text-[150px] font-bold text-slate-100">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-stone-50 p-8">
            <Search className="h-16 w-16 text-slate-400" />
          </div>
        </div>
      </div>

      <h1 className="mt-8 text-3xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
        It might have been moved or doesn&apos;t exist.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link href="/">
          <Button size="lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </Link>
        <Link href="/catalog">
          <Button variant="secondary" size="lg">
            <Search className="mr-2 h-5 w-5" />
            Browse Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}
