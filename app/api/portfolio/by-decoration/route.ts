import { NextRequest, NextResponse } from 'next/server';
import { getProjectsFiltered } from '@/lib/sanity';

export const revalidate = 60;

/**
 * GET /api/portfolio/by-decoration?decoration=screen-printing&limit=8
 * Returns portfolio projects filtered by decoration type. Public endpoint.
 */
export async function GET(request: NextRequest) {
  const decoration = request.nextUrl.searchParams.get('decoration');
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 8), 20);

  if (!decoration) {
    return NextResponse.json({ error: 'decoration param required' }, { status: 400 });
  }

  const decorationSlugs = decoration.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    const projects = await getProjectsFiltered({
      decorationSlugs,
      limit,
    });

    const items = projects.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      client: p.client,
      decoration: p.decoration,
      category: p.category,
      featuredImage: p.featuredImage || (p.gallery?.[0] ?? null),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[Portfolio by decoration] Fetch failed:', err);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}
