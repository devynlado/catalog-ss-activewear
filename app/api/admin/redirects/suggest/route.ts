import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-redirects';
import { suggestRedirectTargets } from '@/lib/slug-redirect-suggestions';
import { extractProductSlug, normalizePath } from '@/lib/slug-redirects';

/**
 * GET /api/admin/redirects/suggest?path=<full-path>&topN=5
 *
 * Returns ranked product suggestions for a `/product/<slug>`-shaped
 * path. Pure advisory — never writes. Admin-only.
 *
 * Gating: the suggestion engine is product-specific (it ranks against
 * the product catalog). Non-product paths get an empty result with
 * `nonProductPath: true` so the UI can show a "no suggestions available
 * for this URL type" hint instead of a useless ranking against
 * arbitrary keywords.
 */
export async function GET(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  // Accept either `path` (full site-relative path, current shape) or
  // `slug` (legacy bare slug — auto-prefixed with /product/) so an old
  // bookmark or cached client doesn't break.
  const rawPath = request.nextUrl.searchParams.get('path');
  const rawSlug = request.nextUrl.searchParams.get('slug');
  const input = rawPath?.trim() || (rawSlug?.trim() ? `/product/${rawSlug.trim()}` : '');

  if (!input) {
    return NextResponse.json({ error: 'path query param is required' }, { status: 400 });
  }

  const normalized = normalizePath(input);
  const productSlug = extractProductSlug(normalized);

  if (!productSlug) {
    return NextResponse.json({
      normalizedSlug: normalized,
      tokens: [],
      detectedStyleCode: null,
      suggestions: [],
      noStrongMatch: true,
      nonProductPath: true,
    });
  }

  const topNRaw = parseInt(request.nextUrl.searchParams.get('topN') || '5', 10);
  const topN = Number.isFinite(topNRaw) ? topNRaw : 5;

  try {
    const result = await suggestRedirectTargets(productSlug, { topN });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[redirects/suggest] failed:', err);
    return NextResponse.json(
      { error: 'Suggestion engine failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
