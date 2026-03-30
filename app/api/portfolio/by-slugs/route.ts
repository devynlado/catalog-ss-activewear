import { NextRequest, NextResponse } from 'next/server';
import { getProjectsBySlugs } from '@/lib/sanity';

export const revalidate = 60;

/**
 * GET /api/portfolio/by-slugs?slugs=slug-1,slug-2,slug-3
 * Returns portfolio projects for specific slugs, preserving order.
 */
export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get('slugs');

  if (!slugsParam) {
    return NextResponse.json({ error: 'slugs param required' }, { status: 400 });
  }

  const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json({ items: [] });
  }

  try {
    const projects = await getProjectsBySlugs(slugs);

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
    console.error('[Portfolio by slugs] Fetch failed:', err);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}
