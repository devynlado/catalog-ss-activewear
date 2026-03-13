/**
 * GROQ queries for blog articles and categories.
 * Only published articles (publishedAt is set) are returned.
 */

export const blogArticleListQuery = `
  *[_type == "blogArticle" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "category": category->{ title, "slug": slug.current },
    tags,
    "featuredImage": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    author,
    publishedAt,
    "excerpt": pt::text(body)[0...200]
  }
`;

export const blogArticleBySlugQuery = `
  *[_type == "blogArticle" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    "slug": slug.current,
    "category": category->{ title, "slug": slug.current },
    tags,
    "featuredImage": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    body[] {
      ...,
      _type == "image" => {
        ...,
        "url": asset->url,
        alt,
        caption
      }
    },
    author,
    publishedAt,
    metaTitle,
    metaDescription,
    "plainBody": pt::text(body)
  }
`;

export const blogArticleSlugsQuery = `
  *[_type == "blogArticle" && defined(publishedAt)] {
    "slug": slug.current,
    "categorySlug": category->slug.current
  }
`;

export const blogRelatedArticlesQuery = `
  *[_type == "blogArticle"
    && defined(publishedAt)
    && slug.current != $currentSlug
    && category._ref == *[_type == "blogArticle" && slug.current == $currentSlug][0].category._ref
  ] | order(publishedAt desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    "category": category->{ title, "slug": slug.current },
    "featuredImage": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    author,
    publishedAt,
    "excerpt": pt::text(body)[0...160]
  }
`;

export const blogCategoriesQuery = `
  *[_type == "blogCategory"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    "articleCount": count(*[_type == "blogArticle" && defined(publishedAt) && category._ref == ^._id])
  }
`;

export const blogArticlesByCategoryQuery = `
  *[_type == "blogArticle"
    && defined(publishedAt)
    && category->slug.current == $categorySlug
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "category": category->{ title, "slug": slug.current },
    tags,
    "featuredImage": featuredImage.asset->url,
    "featuredImageAlt": featuredImage.alt,
    author,
    publishedAt,
    "excerpt": pt::text(body)[0...200]
  }
`;
