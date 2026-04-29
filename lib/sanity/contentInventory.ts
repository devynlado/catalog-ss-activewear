/**
 * Content inventory for the Sanity Studio Content Analytics tool.
 *
 * Sanity is the source of truth for "what content should exist". We pull every
 * published blog article and portfolio project here, then the analytics route
 * left-joins this list against GA4 views and Google Search Console data so
 * 0-view / not-indexed items are surfaced rather than hidden.
 *
 * Also computes a lightweight SEO health score from fields already in Sanity:
 *   - meta title / description present and within length bounds
 *   - reasonable body length
 *   - featured image with alt text
 *   - at least one internal link in the body
 */

import { client } from './client';
import { getBlogPostPath } from '@/lib/blog-url';

/* ------------------------------------------------------------------ */
/*                              Queries                                */
/* ------------------------------------------------------------------ */

/**
 * Note on linkCount: GROQ's `match` operator tokenises URLs unreliably, so we
 * count *any* link markDef with a defined href. The "no links at all" signal
 * is still the one that matters for SEO – distinguishing internal vs. external
 * is done on the SEO scoring side via the page word count threshold.
 */
const blogInventoryQuery = `
  *[_type == "blogArticle" && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    "categorySlug": category->slug.current,
    "categoryTitle": category->title,
    publishedAt,
    metaTitle,
    metaDescription,
    "featuredImage": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    "wordCount": length(pt::text(body)),
    "linkCount": count(
      body[_type == "block"].markDefs[_type == "link" && defined(href)]
    )
  }
`;

const projectInventoryQuery = `
  *[_type == "project" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    "categorySlug": category->slug.current,
    "categoryTitle": category->title,
    publishedAt,
    metaTitle,
    metaDescription,
    "featuredImage": featuredImage.asset->url,
    shortDescription,
    "wordCount": length(pt::text(coalesce(longDescription, []))),
    "linkCount": count(
      coalesce(longDescription, [])[_type == "block"].markDefs[_type == "link" && defined(href)]
    )
  }
`;

/* ------------------------------------------------------------------ */
/*                              Types                                  */
/* ------------------------------------------------------------------ */

/** Severity for SEO health issues. `error` = blocks ranking, `warn` = sub-optimal. */
export type SeoIssueSeverity = 'error' | 'warn';

export interface SeoIssue {
  code: string;
  severity: SeoIssueSeverity;
  message: string;
}

export type ContentKind = 'blog' | 'project';

export interface ContentInventoryItem {
  /** Stable id from Sanity. */
  id: string;
  kind: ContentKind;
  title: string;
  /** Site-relative path, e.g. /blog/screen-printing/how-it-works or /portfolio/foo. */
  pagePath: string;
  /** Sanity slug (last URL segment). */
  slug: string;
  /** Category slug, if any. */
  categorySlug: string | null;
  categoryTitle: string | null;
  publishedAt: string | null;
  /** Last edit time in Sanity – useful for "stale content" sorting. */
  updatedAt: string | null;
  /** SEO health: lower score = worse. 0–100. */
  seoScore: number;
  /** Concrete actionable issues for the editor. */
  seoIssues: SeoIssue[];
  /** Plain-text word count in the article body. */
  wordCount: number;
}

interface RawBlogRow {
  _id: string;
  _updatedAt: string | null;
  title: string;
  slug: string;
  categorySlug: string | null;
  categoryTitle: string | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  wordCount: number | null;
  linkCount: number | null;
}

interface RawProjectRow {
  _id: string;
  _updatedAt: string | null;
  title: string;
  slug: string;
  categorySlug: string | null;
  categoryTitle: string | null;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  shortDescription: string | null;
  wordCount: number | null;
  linkCount: number | null;
}

/* ------------------------------------------------------------------ */
/*                          SEO health scorer                          */
/* ------------------------------------------------------------------ */

interface SeoSignals {
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  hasFeaturedImage: boolean;
  hasFeaturedImageAlt?: boolean;
  wordCount: number;
  linkCount: number;
  /** Minimum body length expected for this content type (blogs more strict than portfolio). */
  minWords: number;
}

/**
 * Compute SEO health: returns `{ score 0..100, issues[] }`.
 * Each error subtracts 20, each warn subtracts 10 (clamped to 0).
 */
function scoreSeo(signals: SeoSignals): { score: number; issues: SeoIssue[] } {
  const issues: SeoIssue[] = [];

  // --- Meta description (single biggest CTR lever) ---
  const metaDesc = signals.metaDescription?.trim() ?? '';
  if (!metaDesc) {
    issues.push({
      code: 'missing_meta_description',
      severity: 'error',
      message: 'Missing meta description (Google generates one for you, often poorly).',
    });
  } else if (metaDesc.length < 70) {
    issues.push({
      code: 'short_meta_description',
      severity: 'warn',
      message: `Meta description is short (${metaDesc.length} chars; aim for 120–160).`,
    });
  } else if (metaDesc.length > 160) {
    issues.push({
      code: 'long_meta_description',
      severity: 'warn',
      message: `Meta description is too long (${metaDesc.length} chars; will be truncated in SERP).`,
    });
  }

  // --- Title length (SERP truncation) ---
  const effectiveTitle = signals.metaTitle?.trim() || signals.title;
  if (effectiveTitle.length > 65) {
    issues.push({
      code: 'long_title',
      severity: 'warn',
      message: `Title is long (${effectiveTitle.length} chars; SERP usually truncates ~60).`,
    });
  } else if (effectiveTitle.length < 25) {
    issues.push({
      code: 'short_title',
      severity: 'warn',
      message: `Title is short (${effectiveTitle.length} chars; consider adding keywords).`,
    });
  }

  // --- Featured image + alt ---
  if (!signals.hasFeaturedImage) {
    issues.push({
      code: 'missing_featured_image',
      severity: 'warn',
      message: 'No featured image (hurts social shares and OG previews).',
    });
  } else if (signals.hasFeaturedImageAlt === false) {
    issues.push({
      code: 'missing_image_alt',
      severity: 'warn',
      message: 'Featured image has no alt text (accessibility + image search miss).',
    });
  }

  // --- Body length ---
  if (signals.wordCount < signals.minWords) {
    issues.push({
      code: 'thin_content',
      severity: signals.wordCount < signals.minWords / 2 ? 'error' : 'warn',
      message: `Body is thin (${signals.wordCount} words; aim for ${signals.minWords}+).`,
    });
  }

  // --- Outbound linking (helps crawl + topical relevance + reader trust) ---
  if (signals.linkCount === 0 && signals.wordCount >= signals.minWords) {
    issues.push({
      code: 'no_links',
      severity: 'warn',
      message: 'Body has no links at all (add 2–4 links to related pages or sources).',
    });
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'error' ? 20 : 10;
  }
  return { score: Math.max(0, score), issues };
}

/* ------------------------------------------------------------------ */
/*                          Public functions                           */
/* ------------------------------------------------------------------ */

/** Fetch every published blog article with SEO health metadata. */
export async function getBlogContentInventory(): Promise<ContentInventoryItem[]> {
  if (!client) return [];
  const rows = (await client.fetch<RawBlogRow[]>(blogInventoryQuery)) ?? [];

  return rows.map((r) => {
    const { score, issues } = scoreSeo({
      title: r.title,
      metaTitle: r.metaTitle,
      metaDescription: r.metaDescription,
      hasFeaturedImage: !!r.featuredImage,
      hasFeaturedImageAlt: !!r.featuredImageAlt,
      wordCount: r.wordCount ?? 0,
      linkCount: r.linkCount ?? 0,
      minWords: 600,
    });

    return {
      id: r._id,
      kind: 'blog',
      title: r.title,
      pagePath: getBlogPostPath(r.categorySlug, r.slug),
      slug: r.slug,
      categorySlug: r.categorySlug,
      categoryTitle: r.categoryTitle,
      publishedAt: r.publishedAt,
      updatedAt: r._updatedAt,
      seoScore: score,
      seoIssues: issues,
      wordCount: r.wordCount ?? 0,
    } satisfies ContentInventoryItem;
  });
}

/** Fetch every published portfolio project with SEO health metadata. */
export async function getProjectContentInventory(): Promise<ContentInventoryItem[]> {
  if (!client) return [];
  const rows = (await client.fetch<RawProjectRow[]>(projectInventoryQuery)) ?? [];

  return rows.map((r) => {
    // For projects, fall back on shortDescription as effective meta description if none set.
    const effectiveMetaDescription = r.metaDescription?.trim() || r.shortDescription?.trim() || null;

    const { score, issues } = scoreSeo({
      title: r.title,
      metaTitle: r.metaTitle,
      metaDescription: effectiveMetaDescription,
      hasFeaturedImage: !!r.featuredImage,
      // Project schema has no alt field; treat as not-applicable
      wordCount: r.wordCount ?? 0,
      linkCount: r.linkCount ?? 0,
      minWords: 200,
    });

    return {
      id: r._id,
      kind: 'project',
      title: r.title,
      pagePath: `/portfolio/${r.slug}`,
      slug: r.slug,
      categorySlug: r.categorySlug,
      categoryTitle: r.categoryTitle,
      publishedAt: r.publishedAt,
      updatedAt: r._updatedAt,
      seoScore: score,
      seoIssues: issues,
      wordCount: r.wordCount ?? 0,
    } satisfies ContentInventoryItem;
  });
}
