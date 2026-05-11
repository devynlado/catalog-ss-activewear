import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-redirects';
import { suggestRedirectTargets } from '@/lib/slug-redirect-suggestions';

/**
 * GET /api/admin/redirects/suggest?slug=<slug>&topN=5
 *
 * Returns ranked product suggestions for an input slug. Pure advisory —
 * never writes. Admin-only.
 */
export async function GET(request: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  if (!slug.trim()) {
    return NextResponse.json({ error: 'slug query param is required' }, { status: 400 });
  }

  const topNRaw = parseInt(request.nextUrl.searchParams.get('topN') || '5', 10);
  const topN = Number.isFinite(topNRaw) ? topNRaw : 5;

  try {
    const result = await suggestRedirectTargets(slug, { topN });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[redirects/suggest] failed:', err);
    return NextResponse.json(
      { error: 'Suggestion engine failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
