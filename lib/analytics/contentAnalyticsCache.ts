/**
 * Shared module-scoped cache for the Studio Content Analytics tool.
 *
 * Lives outside the API route file because Next.js only allows specific
 * exports from `route.ts` (GET, POST, revalidate, etc.). Cache survives
 * between requests on the same warm Lambda instance — good enough for
 * an admin-only feature with a 24h freshness target.
 *
 * Conservative TTL because GSC URL Inspection is rate-limited
 * (2,000/day, 600/min per property).
 */

import type { SeoIssue } from '@/lib/sanity/contentInventory';

/* ------------------------------------------------------------------ */
/*                       Indexation cache                              */
/* ------------------------------------------------------------------ */

interface CachedIndexation {
  indexed: boolean;
  coverageState: string;
  lastCrawlTime?: string | null;
  fetchedAt: number;
}

const INDEXATION_CACHE = new Map<string, CachedIndexation>();
const INDEXATION_TTL_MS = 24 * 60 * 60 * 1000;

export function writeIndexationCache(
  path: string,
  value: Omit<CachedIndexation, 'fetchedAt'>
): void {
  INDEXATION_CACHE.set(path, { ...value, fetchedAt: Date.now() });
}

/** Read the cache, lazily evicting expired entries. */
export function readIndexationCache(): Map<string, CachedIndexation> {
  const now = Date.now();
  for (const [k, v] of INDEXATION_CACHE.entries()) {
    if (now - v.fetchedAt > INDEXATION_TTL_MS) INDEXATION_CACHE.delete(k);
  }
  return INDEXATION_CACHE;
}

/* ------------------------------------------------------------------ */
/*                       Shared response types                         */
/* ------------------------------------------------------------------ */

/** One row per piece of Sanity content, joined with GA4 + GSC + indexation. */
export interface ContentAnalyticsRow {
  id: string;
  kind: 'blog' | 'project';
  pagePath: string;
  title: string;
  categoryTitle: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  /** GA4 page views (full URL across all sources). 0 when absent. */
  views: number;
  /** GSC search analytics over the same window. */
  impressions: number;
  clicks: number;
  /** 0..1 */
  ctr: number;
  /** Average SERP position; null when no impressions. */
  position: number | null;
  /** SEO health score 0..100 derived from Sanity fields. */
  seoScore: number;
  seoIssues: SeoIssue[];
  /** Indexation status loaded lazily by /content-views/inspect; null until then. */
  indexed: boolean | null;
  coverageState: string | null;
  lastCrawlTime: string | null;
}

export interface ContentAnalyticsResponse {
  blogs: ContentAnalyticsRow[];
  projects: ContentAnalyticsRow[];
  /** GA4-only paths under /blog/ or /portfolio/ that don't match any Sanity slug. */
  orphans: Array<{ pagePath: string; views: number; kind: 'blog' | 'project' }>;
  meta: {
    days: number;
    viewsSource: 'ga4' | 'mock' | 'none';
    gscEnabled: boolean;
    gscError?: string;
  };
}

export interface InspectionResponseRow {
  pagePath: string;
  indexed: boolean | null;
  coverageState: string | null;
  lastCrawlTime: string | null;
  error?: string;
}

export interface InspectResponse {
  results: InspectionResponseRow[];
  successCount: number;
  errorCount: number;
}
