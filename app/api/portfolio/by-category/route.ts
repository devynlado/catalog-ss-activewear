import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

const projectsByCategoryQuery = `
  *[_type == "project" && defined(publishedAt)
    && category->slug.current == $categorySlug
    && defined(featuredImage)
  ] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    "slug": slug.current,
    client,
    product,
    decoration,
    quantity,
    turnaround,
    materials,
    "category": category->{ title, "slug": slug.current },
    "featuredImage": featuredImage.asset->url,
    testimonialQuote,
    testimonialAuthor,
    testimonialCompany
  }
`;

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get('category');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '8', 10);

  if (!categorySlug) {
    return NextResponse.json({ error: 'category param required' }, { status: 400 });
  }

  if (!client) {
    return NextResponse.json({ projects: [] });
  }

  const projects = await client.fetch(projectsByCategoryQuery, { categorySlug, limit });

  return NextResponse.json({ projects: projects ?? [] });
}
