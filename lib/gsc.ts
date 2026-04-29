/**
 * Google Search Console (Webmasters) API – server-side only.
 *
 * Two complementary endpoints used by the Content Analytics tool:
 *   1. Search Analytics – per-page impressions, clicks, CTR, position.
 *      → fast, returns thousands of rows in one call. Always loaded.
 *   2. URL Inspection – per-URL indexation status (one request per URL).
 *      → rate-limited (2,000/day, 600/min). Loaded on demand and cached.
 *
 * Required env:
 *   - GSC_SITE_URL: the property as registered in Search Console.
 *       URL-prefix property:  "https://garmentdecor.com/"
 *       Domain property:      "sc-domain:garmentdecor.com"
 *   - GA4_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS):
 *       same service account used for GA4. The service account email must
 *       be added as a User on the GSC property at
 *       https://search.google.com/search-console/users (Restricted is fine).
 */

import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

let cachedAuth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;

  const json = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const credentials = JSON.parse(json) as Record<string, unknown>;
      cachedAuth = new GoogleAuth({ credentials, scopes: SCOPES });
      return cachedAuth;
    } catch (e) {
      console.error('[GSC] Failed to parse GA4_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  cachedAuth = new GoogleAuth({ scopes: SCOPES });
  return cachedAuth;
}

async function authedRequest<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown
): Promise<T> {
  const auth = getAuth();
  const client = await auth.getClient();
  const res = await client.request<T>({ method, url, data: body });
  return res.data;
}

/* ------------------------------------------------------------------ */
/*                       Search Analytics                              */
/* ------------------------------------------------------------------ */

export interface SearchAnalyticsRow {
  /** Full URL as Google has it indexed. */
  page: string;
  clicks: number;
  impressions: number;
  /** Click-through rate, 0..1. */
  ctr: number;
  /** Average SERP position; lower is better. */
  position: number;
}

interface RawSearchAnalyticsResponse {
  rows?: Array<{
    keys: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
}

/**
 * Fetch per-page Search Analytics for `siteUrl` between dates (YYYY-MM-DD).
 * Returns a map keyed by **path** (pathname only) so callers can join with GA4 paths
 * and Sanity slugs without worrying about scheme/host variants.
 */
export async function fetchSearchAnalyticsByPath(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<Map<string, SearchAnalyticsRow>> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  const allRows: SearchAnalyticsRow[] = [];
  let startRow = 0;
  const rowLimit = 25000;

  for (;;) {
    const data = await authedRequest<RawSearchAnalyticsResponse>('POST', url, {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit,
      startRow,
    });
    const rows = data.rows ?? [];
    if (rows.length === 0) break;

    for (const r of rows) {
      const fullUrl = r.keys?.[0];
      if (!fullUrl) continue;
      allRows.push({
        page: fullUrl,
        clicks: Number(r.clicks ?? 0),
        impressions: Number(r.impressions ?? 0),
        ctr: Number(r.ctr ?? 0),
        position: Number(r.position ?? 0),
      });
    }

    if (rows.length < rowLimit) break;
    startRow += rows.length;
  }

  const byPath = new Map<string, SearchAnalyticsRow>();
  for (const row of allRows) {
    const path = urlToPath(row.page);
    // Multiple URL variants (trailing slash, www, http vs https) collapse onto the same path.
    const existing = byPath.get(path);
    if (existing) {
      const totalClicks = existing.clicks + row.clicks;
      const totalImpressions = existing.impressions + row.impressions;
      // Re-derive average position weighted by impressions (more accurate than mean).
      const weightedPosition =
        totalImpressions > 0
          ? (existing.position * existing.impressions + row.position * row.impressions) /
            totalImpressions
          : 0;
      byPath.set(path, {
        page: existing.page,
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        position: weightedPosition,
      });
    } else {
      byPath.set(path, row);
    }
  }
  return byPath;
}

/** Extract the path portion of a URL (returns input unchanged if not a URL). */
function urlToPath(maybeUrl: string): string {
  try {
    const u = new URL(maybeUrl);
    return u.pathname || '/';
  } catch {
    return maybeUrl;
  }
}

/* ------------------------------------------------------------------ */
/*                       URL Inspection                                */
/* ------------------------------------------------------------------ */

/** Indexation status for a single URL. */
export interface UrlInspectionResult {
  /** True if Google has the page in its index AND is willing to serve it. */
  indexed: boolean;
  /** Raw verdict from Google ("PASS", "PARTIAL", "FAIL", "NEUTRAL"). */
  verdict: string;
  /** Human-readable coverage state, e.g. "Submitted and indexed". */
  coverageState: string;
  /** ISO timestamp Google last crawled the page, if known. */
  lastCrawlTime?: string;
  /** robots.txt allowance ("ALLOWED" / "DISALLOWED" / etc.). */
  robotsTxtState?: string;
  /** Page fetch outcome ("SUCCESSFUL" / "SOFT_404" / etc.). */
  pageFetchState?: string;
  /** Indexing decision ("INDEXING_ALLOWED" / "BLOCKED_BY_*" / etc.). */
  indexingState?: string;
  /** Canonical URL Google selected for this page. */
  googleCanonical?: string;
  /** Canonical URL declared by your page (rel="canonical"). */
  userCanonical?: string;
  /** Mobile usability summary. */
  mobileUsable?: boolean;
}

interface RawInspectionResponse {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      lastCrawlTime?: string;
      robotsTxtState?: string;
      pageFetchState?: string;
      indexingState?: string;
      googleCanonical?: string;
      userCanonical?: string;
    };
    mobileUsabilityResult?: {
      verdict?: string;
    };
  };
}

/**
 * Inspect a single URL. Throws on auth failure; resolves with a "not indexed"
 * placeholder for transient errors so a single bad URL doesn't sink a batch.
 */
export async function inspectUrl(
  siteUrl: string,
  inspectionUrl: string
): Promise<UrlInspectionResult> {
  const data = await authedRequest<RawInspectionResponse>(
    'POST',
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    { inspectionUrl, siteUrl }
  );

  const idx = data.inspectionResult?.indexStatusResult ?? {};
  const verdict = idx.verdict ?? 'VERDICT_UNSPECIFIED';
  const coverageState = idx.coverageState ?? 'Unknown';

  // "Submitted and indexed" / "Indexed, not submitted in sitemap" → indexed.
  // Anything containing "not indexed" is the negative case.
  const indexed =
    verdict === 'PASS' ||
    (/indexed/i.test(coverageState) && !/not\s*indexed/i.test(coverageState));

  return {
    indexed,
    verdict,
    coverageState,
    lastCrawlTime: idx.lastCrawlTime,
    robotsTxtState: idx.robotsTxtState,
    pageFetchState: idx.pageFetchState,
    indexingState: idx.indexingState,
    googleCanonical: idx.googleCanonical,
    userCanonical: idx.userCanonical,
    mobileUsable: data.inspectionResult?.mobileUsabilityResult?.verdict === 'PASS',
  };
}

/**
 * Inspect multiple URLs with bounded concurrency.
 * GSC URL Inspection limit: 600/min, 2,000/day per property — keep concurrency low.
 */
export async function inspectUrls(
  siteUrl: string,
  urls: string[],
  concurrency = 5
): Promise<Map<string, UrlInspectionResult | { error: string }>> {
  const result = new Map<string, UrlInspectionResult | { error: string }>();
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      try {
        const r = await inspectUrl(siteUrl, url);
        result.set(url, r);
      } catch (err) {
        result.set(url, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return result;
}

/* ------------------------------------------------------------------ */
/*                            Helpers                                  */
/* ------------------------------------------------------------------ */

/** True if env is configured for GSC calls. */
export function isGscConfigured(): boolean {
  if (!process.env.GSC_SITE_URL) return false;
  return !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
