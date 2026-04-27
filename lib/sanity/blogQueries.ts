/**
 * GROQ queries for blog articles and categories.
 * Only articles that are live for the public: publishedAt set and not in the future
 * (scheduled posts in Sanity set publishedAt ahead of time — exclude until then).
 */

const publishedPublicPredicate = `defined(publishedAt) && publishedAt <= now()`;

export const blogArticleListQuery = `
  *[_type == "blogArticle" && ${publishedPublicPredicate}] | order(publishedAt desc) {
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
  *[_type == "blogArticle" && slug.current == $slug && ${publishedPublicPredicate}][0] {
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
  *[_type == "blogArticle" && ${publishedPublicPredicate}] {
    "slug": slug.current,
    "categorySlug": category->slug.current
  }
`;

export const blogRelatedArticlesQuery = `
  *[_type == "blogArticle"
    && ${publishedPublicPredicate}
    && slug.current != $currentSlug
    && category._ref == *[_type == "blogArticle" && slug.current == $currentSlug && ${publishedPublicPredicate}][0].category._ref
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
    "articleCount": count(*[_type == "blogArticle" && ${publishedPublicPredicate} && category._ref == ^._id])
  }
`;

export const blogArticlesByCategoryQuery = `
  *[_type == "blogArticle"
    && ${publishedPublicPredicate}
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
