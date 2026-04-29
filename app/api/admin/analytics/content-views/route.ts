import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchContentViews } from '@/lib/ga4';
import {
  getBlogContentInventory,
  getProjectContentInventory,
  type ContentInventoryItem,
} from '@/lib/sanity/contentInventory';
import { fetchSearchAnalyticsByPath, isGscConfigured } from '@/lib/gsc';
import {
  readIndexationCache,
  type ContentAnalyticsResponse,
  type ContentAnalyticsRow,
} from '@/lib/analytics/contentAnalyticsCache';

/**
 * GET /api/admin/analytics/content-views?days=30 – admin-only.
 *
 * Returns one row per published Sanity blog/project (so 0-view items appear),
 * left-joined with GA4 page views and GSC Search Analytics impressions/clicks/
 * CTR/position. Indexation status is loaded lazily by the /inspect sub-route
 * to avoid blocking on the GSC URL Inspection rate limit (2,000/day).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to view analytics.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { profile } = await getServerProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);
    const dateRangeDays = [7, 30, 90].includes(days) ? days : 30;

    // ----------------------------------------------------------------
    // 1. Sanity inventory (source of truth for "what should exist").
    //    Always fetched – this is what makes 0-view items show up.
    // ----------------------------------------------------------------
    const [blogsInventory, projectsInventory] = await Promise.all([
      getBlogContentInventory(),
      getProjectContentInventory(),
    ]);

    // ----------------------------------------------------------------
    // 2. GA4 page views. Best-effort; degrades to mock data when GA4
    //    isn't configured (matches old behaviour).
    // ----------------------------------------------------------------
    const propertyId = process.env.GA4_PROPERTY_ID;
    const hasGa4Credentials =
      !!process.env.GA4_SERVICE_ACCOUNT_JSON ||
      !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let viewsSource: 'ga4' | 'mock' | 'none' = 'none';
    const viewsByPath = new Map<string, number>();

    if (propertyId && hasGa4Credentials) {
      try {
        const [blogViews, projectViews] = await Promise.all([
          fetchContentViews(propertyId, '/blog/', dateRangeDays),
          fetchContentViews(propertyId, '/portfolio/', dateRangeDays),
        ]);
        for (const v of [...blogViews, ...projectViews]) {
          viewsByPath.set(v.pagePath, (viewsByPath.get(v.pagePath) ?? 0) + v.views);
        }
        viewsSource = 'ga4';
      } catch (err) {
        console.error('[Analytics] GA4 content-views fetch failed:', err);
        viewsSource = 'none';
      }
    } else {
      const mock = mockViewsByPath();
      for (const [k, v] of mock) viewsByPath.set(k, v);
      viewsSource = 'mock';
    }

    // ----------------------------------------------------------------
    // 3. Google Search Console: impressions / clicks / CTR / position.
    //    Optional – page renders fine without it.
    // ----------------------------------------------------------------
    let gscEnabled = false;
    let gscError: string | undefined;
    let gscByPath: Awaited<ReturnType<typeof fetchSearchAnalyticsByPath>> = new Map();
    const gscSiteUrl = process.env.GSC_SITE_URL;

    if (isGscConfigured() && gscSiteUrl) {
      try {
        const { startStr, endStr } = resolveDateRange(dateRangeDays);
        gscByPath = await fetchSearchAnalyticsByPath(gscSiteUrl, startStr, endStr);
        gscEnabled = true;
      } catch (err) {
        console.error('[Analytics] GSC search analytics fetch failed:', err);
        gscError = err instanceof Error ? err.message : String(err);
      }
    } else {
      gscError = 'GSC_SITE_URL not set – Search Console data unavailable.';
    }

    // ----------------------------------------------------------------
    // 4. Merge: every Sanity item appears, GA4/GSC layered on top.
    // ----------------------------------------------------------------
    const consumed = new Set<string>();
    const cachedIndexation = readIndexationCache();

    const buildRows = (items: ContentInventoryItem[]): ContentAnalyticsRow[] =>
      items.map((item) => {
        const views = viewsByPath.get(item.pagePath) ?? 0;
        consumed.add(item.pagePath);
        const gsc = gscByPath.get(item.pagePath);
        const indexationCached = cachedIndexation.get(item.pagePath);

        return {
          id: item.id,
          kind: item.kind,
          pagePath: item.pagePath,
          title: item.title,
          categoryTitle: item.categoryTitle,
          publishedAt: item.publishedAt,
          updatedAt: item.updatedAt,
          views,
          impressions: gsc?.impressions ?? 0,
          clicks: gsc?.clicks ?? 0,
          ctr: gsc?.ctr ?? 0,
          position: gsc && gsc.impressions > 0 ? gsc.position : null,
          seoScore: item.seoScore,
          seoIssues: item.seoIssues,
          indexed: indexationCached?.indexed ?? null,
          coverageState: indexationCached?.coverageState ?? null,
          lastCrawlTime: indexationCached?.lastCrawlTime ?? null,
        };
      });

    const blogs = buildRows(blogsInventory);
    const projects = buildRows(projectsInventory);

    // Orphan detection: GA4 paths under /blog/ or /portfolio/ not matching any Sanity slug.
    const orphans: ContentAnalyticsResponse['orphans'] = [];
    for (const [path, views] of viewsByPath.entries()) {
      if (consumed.has(path)) continue;
      if (path.startsWith('/blog/')) {
        orphans.push({ pagePath: path, views, kind: 'blog' });
      } else if (path.startsWith('/portfolio/')) {
        orphans.push({ pagePath: path, views, kind: 'project' });
      }
    }
    orphans.sort((a, b) => b.views - a.views);

    return NextResponse.json({
      blogs,
      projects,
      orphans,
      meta: {
        days: dateRangeDays,
        viewsSource,
        gscEnabled,
        gscError,
      },
    } satisfies ContentAnalyticsResponse);
  } catch (err) {
    console.error('[Analytics] content-views route error:', err);
    return NextResponse.json(
      {
        error: 'Could not load content analytics.',
        code: 'SERVER_ERROR',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*                           Helpers                                   */
/* ------------------------------------------------------------------ */

function resolveDateRange(days: number): { startStr: string; endStr: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

/**
 * Sample views for the demo path (no GA4 configured). Keys may not match real
 * Sanity slugs – they fall through to the orphan list, which is exactly what
 * we'd want production GA4 data to do for renamed/deleted content.
 */
function mockViewsByPath(): Map<string, number> {
  return new Map<string, number>([
    ['/blog/screen-printing/how-screen-printing-works', 1842],
    ['/blog/screen-printing/screen-printing-vs-dtg', 1235],
    ['/blog/embroidery/custom-embroidery-guide', 987],
    ['/portfolio/custom-jerseys-la-league', 524],
    ['/portfolio/corporate-polos-tech-startup', 412],
  ]);
}
