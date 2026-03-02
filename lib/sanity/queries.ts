/**
 * GROQ queries for portfolio projects and categories.
 * Only fetch published projects (publishedAt is set).
 */

export const projectListQuery = `
  *[_type == "project" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "category": category->{ title, "slug": slug.current },
    decoration,
    client,
    "featuredImage": featuredImage.asset->url,
    "gallery": gallery[].asset->url,
    publishedAt
  }
`;

export const projectBySlugQuery = `
  *[_type == "project" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    "slug": slug.current,
    tags,
    "category": category->{ title, "slug": slug.current },
    product,
    decoration,
    materials,
    designName,
    client,
    quantity,
    turnaround,
    shortDescription,
    longDescription,
    "featuredImage": featuredImage.asset->url,
    "gallery": gallery[].asset->url,
    testimonialQuote,
    testimonialAuthor,
    testimonialCompany,
    metaTitle,
    metaDescription,
    publishedAt
  }
`;

export const projectSlugsQuery = `
  *[_type == "project" && defined(publishedAt)].slug.current
`;

/** Related projects: same decoration, exclude current slug, limit 4 */
export const relatedProjectsQuery = `
  *[_type == "project" && decoration == $decoration && slug.current != $currentSlug && defined(publishedAt)] | order(publishedAt desc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "category": category->title,
    decoration,
    "featuredImage": featuredImage.asset->url,
    "gallery": gallery[0].asset->url
  }
`;

export const categoriesQuery = `
  *[_type == "portfolioCategory"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }
`;

/**
 * Archive: filter by decoration slugs (multi) and full-text search.
 * Product-used filter is applied in app code via projectProductMatchesCategories.
 * Search matches: title, shortDescription, product, materials, designName, client, longDescription (pt::text).
 * Pass searchPattern as *term* for contains (sanitize * in term on the caller).
 * Includes product so we can filter by product category client-side.
 */
export const projectArchiveFilterQuery = `
  *[_type == "project" && defined(publishedAt)
    && (!defined($decorationSlugs) || count($decorationSlugs) == 0 || decoration in $decorationSlugs)
    && (
      !defined($searchPattern) || $searchPattern == "" || $searchPattern == "*"
      || title match $searchPattern
      || shortDescription match $searchPattern
      || product match $searchPattern
      || materials match $searchPattern
      || designName match $searchPattern
      || client match $searchPattern
      || (defined(longDescription) && pt::text(longDescription) match $searchPattern)
    )
  ] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "category": category->{ title, "slug": slug.current },
    product,
    decoration,
    client,
    "featuredImage": featuredImage.asset->url,
    "gallery": gallery[].asset->url,
    publishedAt
  }
`;
