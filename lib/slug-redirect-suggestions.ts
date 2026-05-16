/**
 * Slug → product suggestion engine.
 *
 * Used by the admin "Suggest match" UI on /admin/redirects. Given a
 * legacy slug (e.g. `womens-fine-jersey-tee-2`), returns a ranked list
 * of candidate products with a 0–100 confidence score and human-readable
 * reasons for each match.
 *
 * Strategy
 * --------
 * The primary path **reuses the same scoring as the customer-facing
 * header search** (`searchProductsScored` in lib/product-cache.ts). This
 * keeps relevance behavior consistent across admin and shopper, and lets
 * future improvements to the catalog search automatically benefit this
 * tool.
 *
 *   1. Normalize the slug (strip `/product/`, strip the WooCommerce
 *      `-2` duplicate suffix) and turn it into a space-separated query
 *      so it looks like what a shopper would type.
 *   2. Run that query through `searchProductsScored`. Over-fetch and
 *      keep the top N by raw score.
 *   3. Normalize each raw score to a 0–100 confidence value sized to
 *      the number of search terms.
 *   4. Synthesize human-readable reasons from which terms hit
 *      style_name / title / brand_name.
 *
 * The brand dictionary (`lib/slug-redirect-brand-dict.ts`) is now a
 * **fallback only**. It runs when the literal title search returned no
 * strong match AND the slug contained a marketing phrase the dictionary
 * recognizes (e.g. `dri-power`, `comfort-colors`). In that case we re-run
 * the search using the dictionary's style hints as the query so the
 * canonical SKU still surfaces.
 *
 * The engine is purely advisory. It never writes anything.
 */

import { searchProductsScored, type ScoredProductRow } from './product-cache';
import { BRAND_DICTIONARY } from './slug-redirect-brand-dict';

/**
 * Lower-case, hyphen-only slug normalization for the suggestion engine.
 *
 * The runtime redirect engine now uses `normalizePath` against full
 * site-relative paths (e.g. `/product/heavyweight-tee`). Suggestions, by
 * contrast, are product-specific and operate on the *bare* slug part
 * (`heavyweight-tee`). The API route extracts the bare slug via
 * `extractProductSlug` before calling this engine, so we just need a
 * conservative cleanup of any remaining cruft (case, trailing slashes,
 * stray product/ prefix from an old-format input).
 */
function normalizeBareSlug(input: string): string {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^product\//, '')
    .replace(/\/+$/, '');
}

export interface SuggestedProduct {
  style_id: number;
  brand_name: string;
  style_name: string;
  title: string;
  slug: string | null;
  primary_image_url: string | null;
  is_active: boolean;
  manually_hidden: boolean;
  /** 0–100; higher = more confident. */
  score: number;
  /** Human-readable explanations the admin can scan. */
  reasons: string[];
}

export interface SuggestionResult {
  /** Slug after normalization (what the engine actually scored against). */
  normalizedSlug: string;
  /** Search terms derived from the slug (drives the literal search). */
  tokens: string[];
  /** Detected style code, if any (e.g. "1510" from "womens-1510-tee"). */
  detectedStyleCode: string | null;
  /** Top N candidates, sorted by score desc. */
  suggestions: SuggestedProduct[];
  /**
   * True when no candidate scored ≥ STRONG_MATCH_THRESHOLD.
   * The admin UI uses this to nudge toward a Category-type redirect.
   */
  noStrongMatch: boolean;
}

/** Score threshold below which we surface the "no strong match" hint. */
export const STRONG_MATCH_THRESHOLD = 70;

/** Score threshold below which we trigger the brand-dictionary fallback. */
const FALLBACK_TRIGGER_SCORE = 50;

/** Confidence score we assign to dictionary-only fallback matches. */
const FALLBACK_BASE_SCORE = 55;

/** How many top candidates we return by default. */
export const DEFAULT_TOP_N = 5;

/** Hard cap on candidates returned even when caller asks for more. */
const MAX_TOP_N = 15;

/**
 * Strip the WooCommerce duplicate suffix (`-2`, `-3`, …) from a slug.
 * The number is treated as metadata, not as a meaningful token.
 */
function stripDuplicateSuffix(slug: string): string {
  return slug.replace(/-(\d{1,2})$/, '');
}

/**
 * Look for an embedded style code: a short alphanumeric token that
 * looks like a brand SKU. Used purely for diagnostics in the UI; the
 * search engine already handles style codes via exact `style_name` match.
 */
function detectStyleCode(tokens: string[]): string | null {
  const patterns = [
    /^[a-z]{1,3}\d{2,5}[a-z]{0,3}$/, // pc61, gdh100, ss4500, ind4000
    /^\d{3,5}[a-z]{1,4}$/,           // 3001cvc, 29mp, 21mr
    /^[a-z]\d{2,4}$/,                // s149, t425
    /^\d{4,5}$/,                     // 1510, 64000
  ];
  for (const tok of tokens) {
    for (const re of patterns) {
      if (re.test(tok)) return tok;
    }
  }
  return null;
}

/**
 * Build hyphenated n-gram windows so multi-word brand phrases like
 * `dri-power` or `fine-jersey` can be matched against the dictionary
 * even when surrounded by other tokens in the slug.
 */
function generateNgrams(tokens: string[], maxN = 3): Set<string> {
  const set = new Set<string>(tokens);
  for (let n = 2; n <= maxN; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      set.add(tokens.slice(i, i + n).join('-'));
    }
  }
  return set;
}

/**
 * Walk the brand dictionary and return entries whose phrase appears in
 * the n-gram set built from the slug.
 */
function matchedBrandEntries(ngrams: Set<string>) {
  return BRAND_DICTIONARY.filter((entry) => ngrams.has(entry.phrase));
}

/**
 * Map a raw `calculateSearchScore` value into a 0–100 confidence number
 * that's meaningful regardless of how many terms were in the query.
 *
 * The reference score grows with the query length, so:
 *   - 1-term query: any non-trivial hit (≥ 50) is strong (capped to 100)
 *   - 4-term query: all 4 terms in title (~120) lands near 100
 *   - 4-term query: 2 of 4 in title (~60) lands at ~60 (medium)
 */
function normalizeScore(raw: number, numTerms: number): number {
  const reference = Math.max(50, numTerms * 25);
  return Math.min(100, Math.max(0, Math.round((raw / reference) * 100)));
}

/**
 * Inspect which search terms actually hit which fields, and return a
 * short list of human-readable reasons.
 *
 * Matches the comparison semantics used by `calculateSearchScore`
 * (uppercase substring) so the reasons line up with the score.
 */
function buildReasons(row: ScoredProductRow, searchTermsUpper: string[]): string[] {
  const reasons: string[] = [];
  const styleName = (row.style_name || '').toUpperCase();
  const brandName = (row.brand_name || '').toUpperCase();
  const title = (row.title_optimized || row.title_raw || '').toUpperCase();

  const styleHits: string[] = [];
  const titleHits: string[] = [];
  const brandHits: string[] = [];

  for (const term of searchTermsUpper) {
    if (styleName === term) {
      reasons.unshift(`exact style code: ${row.style_name}`);
    } else if (styleName.includes(term)) {
      styleHits.push(term);
    }
    if (title.includes(term)) titleHits.push(term);
    if (brandName.includes(term)) brandHits.push(term);
  }

  if (titleHits.length > 0) {
    reasons.push(`title matches: ${titleHits.slice(0, 4).join(', ').toLowerCase()}`);
  }
  if (brandHits.length > 0) {
    reasons.push(`brand matches: ${brandHits.slice(0, 3).join(', ').toLowerCase()}`);
  }
  if (styleHits.length > 0 && !reasons.some((r) => r.startsWith('exact style'))) {
    reasons.push(`style contains: ${styleHits.slice(0, 3).join(', ').toLowerCase()}`);
  }

  return reasons;
}

/** Project a ScoredProductRow into the wire shape with a confidence score. */
function projectRow(
  row: ScoredProductRow,
  score: number,
  reasons: string[],
): SuggestedProduct {
  // Penalize unavailability so we never accidentally rank a dead SKU
  // above a live one. Penalty is on the normalized 0-100 scale.
  let finalScore = score;
  const adjustedReasons = [...reasons];
  if (row.manually_hidden) {
    finalScore = Math.max(0, finalScore - 30);
    adjustedReasons.push('penalty: product is hidden');
  } else if (row.is_active === false) {
    finalScore = Math.max(0, finalScore - 20);
    adjustedReasons.push('penalty: product is inactive');
  }
  return {
    style_id: row.style_id,
    brand_name: row.brand_name,
    style_name: row.style_name,
    title: row.title_optimized || row.title_raw || row.style_name,
    slug: row.slug,
    primary_image_url: row.primary_image_url,
    is_active: row.is_active,
    manually_hidden: row.manually_hidden,
    score: finalScore,
    reasons: adjustedReasons,
  };
}

/** Public entry point. */
export async function suggestRedirectTargets(
  slug: string,
  options: { topN?: number } = {},
): Promise<SuggestionResult> {
  const topN = Math.min(Math.max(options.topN ?? DEFAULT_TOP_N, 1), MAX_TOP_N);

  // --- Normalize the slug into both a token set (for diagnostics + dict
  //     lookup) and a search query (for the primary search engine).
  const normalized = normalizeBareSlug(slug);
  const stripped = stripDuplicateSuffix(normalized);
  const rawTokens = stripped
    .split(/[-_/]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 2);
  const ngrams = generateNgrams(rawTokens);
  const detectedStyleCode = detectStyleCode(rawTokens);
  const brandEntries = matchedBrandEntries(ngrams);

  const searchQuery = stripped.replace(/[-_/]+/g, ' ').trim();
  const searchTermsUpper = searchQuery
    .toUpperCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (searchTermsUpper.length === 0) {
    return {
      normalizedSlug: normalized,
      tokens: rawTokens,
      detectedStyleCode,
      suggestions: [],
      noStrongMatch: true,
    };
  }

  // --- Primary: same scoring path as the customer search.
  const primaryRows = await searchProductsScored(searchQuery, {
    limit: Math.max(topN * 4, 20),
    includeInactive: true,
  });

  const projected = primaryRows.map((row) => {
    const score = normalizeScore(row.score, searchTermsUpper.length);
    const reasons = buildReasons(row, searchTermsUpper);
    return projectRow(row, score, reasons);
  });

  // --- Fallback: dictionary-targeted search, but only if the primary
  //     failed to surface anything strong AND the slug contained a
  //     marketing phrase we recognize.
  const topPrimaryScore = projected[0]?.score ?? 0;
  if (topPrimaryScore < FALLBACK_TRIGGER_SCORE && brandEntries.length > 0) {
    const hints = Array.from(
      new Set(brandEntries.flatMap((e) => e.style_hints ?? [])),
    );
    if (hints.length > 0) {
      const fallbackQuery = hints.join(' ');
      const fallbackRows = await searchProductsScored(fallbackQuery, {
        limit: topN * 2,
        includeInactive: true,
      });

      const existingIds = new Set(projected.map((p) => p.style_id));
      const dictNote = brandEntries.find((e) => e.note)?.note;
      const phraseList = brandEntries.map((e) => e.phrase).join(', ');

      for (const row of fallbackRows) {
        if (existingIds.has(row.style_id)) continue;
        const reasons = [
          `brand dictionary: "${phraseList}" → ${row.brand_name} ${row.style_name}`,
        ];
        if (dictNote) reasons.push(dictNote);
        projected.push(projectRow(row, FALLBACK_BASE_SCORE, reasons));
      }
    }
  }

  projected.sort((a, b) => b.score - a.score);
  const top = projected.slice(0, topN);
  const noStrongMatch = top.length === 0 || top[0].score < STRONG_MATCH_THRESHOLD;

  return {
    normalizedSlug: normalized,
    tokens: rawTokens,
    detectedStyleCode,
    suggestions: top,
    noStrongMatch,
  };
}
