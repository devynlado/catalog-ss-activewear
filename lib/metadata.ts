import type { Metadata } from 'next';

const DEFAULT_OG_IMAGE = '/images/og-default.png';

/**
 * Base URL for the site (no trailing slash). Prefer NEXT_PUBLIC_SITE_URL in production.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
}

export type CreatePageMetadataOptions = {
  /** Page title (can include " | Garment Decor" or use template from root layout). */
  title: string;
  /** Meta description (155–160 chars recommended). */
  description: string;
  /** Path for canonical and OpenGraph URL (e.g. "/about", "/contact"). Leading slash optional. */
  path: string;
  /** Optional OG/Twitter image URL (absolute or path). Defaults to site OG default. */
  image?: string;
  /** Optional: set noindex for utility/private pages (e.g. checkout, dashboard). */
  noIndex?: boolean;
  /** Optional: OpenGraph type. Default "website". Use "article" for blog/portfolio items. */
  openGraphType?: 'website' | 'article';
};

/**
 * Builds full SEO metadata for a page: title, description, canonical, OpenGraph, and Twitter Card.
 * Use for every public page so new pages get consistent technical SEO.
 *
 * @example
 * // In a page or layout:
 * export const metadata = createPageMetadata({
 *   title: 'About Us | Garment Decor',
 *   description: 'Learn about our screen printing and embroidery company.',
 *   path: '/about',
 * });
 */
export function createPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  openGraphType = 'website',
}: CreatePageMetadataOptions): Metadata {
  const base = getSiteUrl();
  const pathNormalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${pathNormalized}`;
  const imageUrl = image?.startsWith('http') ? image : image ? `${base}${image.startsWith('/') ? image : `/${image}`}` : `${base}${DEFAULT_OG_IMAGE}`;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Garment Decor',
      type: openGraphType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };

  if (noIndex) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}
