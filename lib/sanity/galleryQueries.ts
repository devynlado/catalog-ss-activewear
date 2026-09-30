/**
 * GROQ queries for portfolio gallery items (photos & videos).
 * Only fetch published items (publishedAt is set).
 *
 * Filtering:
 * - $contentType: 'photo' | 'video'
 * - $decorationSlugs: string[] — OR match (empty array = no decoration filter)
 * - $blankSlug: string | '' — exact match ('' = no blank filter)
 */
export const galleryItemsQuery = `
  *[_type == "portfolioGalleryItem"
    && defined(publishedAt)
    && contentType == $contentType
    && (count($decorationSlugs) == 0 || count(decoration[@ in $decorationSlugs]) > 0)
    && ($blankSlug == "" || blankCategory == $blankSlug)
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    contentType,
    decoration,
    blankCategory,
    client,
    turnaround,
    quantity,
    "image": image.asset->url,
    "imageAlt": image.alt,
    "imageWidth": image.asset->metadata.dimensions.width,
    "imageHeight": image.asset->metadata.dimensions.height,
    "imageAspect": image.asset->metadata.dimensions.aspectRatio,
    videoUrl,
    "coverImage": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,
    "coverAspect": coverImage.asset->metadata.dimensions.aspectRatio,
    publishedAt
  }
`;
