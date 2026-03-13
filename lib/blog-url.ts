/**
 * Build the path for a blog post: /blog/{categorySlug}/{postSlug}
 * Falls back to /blog/uncategorized/{postSlug} when category is missing.
 */
export function getBlogPostPath(
  categorySlug: string | null | undefined,
  postSlug: string
): string {
  const cat = categorySlug || 'uncategorized';
  return `/blog/${cat}/${postSlug}`;
}
