import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { inspectUrls, isGscConfigured } from '@/lib/gsc';
import {
  writeIndexationCache,
  type InspectionResponseRow,
  type InspectResponse,
} from '@/lib/analytics/contentAnalyticsCache';

/**
 * POST /api/admin/analytics/content-views/inspect
 * Body: { paths: string[] }
 *
 * Inspects each URL in Google Search Console (URL Inspection API) and writes
 * the result into the shared 24h cache used by the main content-views route.
 *
 * Why this is a separate endpoint:
 *   - Each inspection takes 1–2s; with 100+ URLs the main GET would time out.
 *   - The URL Inspection API is rate-limited (2,000/day, 600/min) so we keep
 *     concurrency low (5) and let the editor trigger the run on demand.
 */
const MAX_BATCH = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { profile } = await getServerProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 });
    }

    if (!isGscConfigured()) {
      return NextResponse.json(
        {
          error:
            'Google Search Console not configured. Set GSC_SITE_URL and ensure the GA4 service account is a User on the GSC property.',
          code: 'GSC_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const siteUrl = process.env.GSC_SITE_URL!;
    // Use the public site URL as the base for absolute inspection URLs.
    // GSC accepts both URL-prefix properties and sc-domain:* properties; we
    // resolve to absolute https URLs either way.
    const inspectBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';

    const body = (await request.json().catch(() => null)) as { paths?: unknown } | null;
    const paths = Array.isArray(body?.paths)
      ? (body!.paths as unknown[]).filter((p): p is string => typeof p === 'string').slice(0, MAX_BATCH)
      : [];

    if (paths.length === 0) {
      return NextResponse.json(
        { error: 'Provide a non-empty paths[] array.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Convert relative paths → absolute URLs for the API.
    const pathToUrl = new Map<string, string>();
    for (const p of paths) {
      const path = p.startsWith('/') ? p : `/${p}`;
      const absolute = inspectBase.replace(/\/$/, '') + path;
      pathToUrl.set(path, absolute);
    }

    const urls = [...pathToUrl.values()];
    const inspectionResults = await inspectUrls(siteUrl, urls, 5);

    let successCount = 0;
    let errorCount = 0;
    const results: InspectionResponseRow[] = [];

    for (const [path, url] of pathToUrl.entries()) {
      const r = inspectionResults.get(url);
      if (!r) {
        errorCount++;
        results.push({
          pagePath: path,
          indexed: null,
          coverageState: null,
          lastCrawlTime: null,
          error: 'No response from GSC.',
        });
        continue;
      }
      if ('error' in r) {
        errorCount++;
        results.push({
          pagePath: path,
          indexed: null,
          coverageState: null,
          lastCrawlTime: null,
          error: r.error,
        });
        continue;
      }
      successCount++;
      writeIndexationCache(path, {
        indexed: r.indexed,
        coverageState: r.coverageState,
        lastCrawlTime: r.lastCrawlTime ?? null,
      });
      results.push({
        pagePath: path,
        indexed: r.indexed,
        coverageState: r.coverageState,
        lastCrawlTime: r.lastCrawlTime ?? null,
      });
    }

    return NextResponse.json({ results, successCount, errorCount } satisfies InspectResponse);
  } catch (err) {
    console.error('[Analytics] inspect route error:', err);
    return NextResponse.json(
      {
        error: 'URL inspection failed.',
        code: 'INSPECT_ERROR',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
