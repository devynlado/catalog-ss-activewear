/**
 * Append Sanity image CDN transform params to an asset URL.
 *
 * The gallery queries return fully-qualified `cdn.sanity.io` URLs (via
 * `image.asset->url`). Sanity's image CDN supports on-the-fly transforms as
 * query params, so we can request a properly-sized, modern-format image
 * instead of downloading the full-resolution original for a small thumbnail.
 *
 * Non-Sanity URLs (or empty values) are returned unchanged so the helper is
 * safe to apply unconditionally.
 */
export function sanityImageUrl(
  url: string | null | undefined,
  opts: {
    width?: number;
    height?: number;
    quality?: number;
    fit?: 'crop' | 'max' | 'clip' | 'fill';
  } = {}
): string | null {
  if (!url) return null;
  if (!url.includes('cdn.sanity.io')) return url;

  const { width, height, quality = 75, fit } = opts;
  const params = new URLSearchParams();
  if (width) params.set('w', String(width));
  if (height) params.set('h', String(height));
  if (fit) params.set('fit', fit);
  params.set('q', String(quality));
  // Serve WebP/AVIF to browsers that support it — big size win.
  params.set('auto', 'format');

  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${params.toString()}`;
}
