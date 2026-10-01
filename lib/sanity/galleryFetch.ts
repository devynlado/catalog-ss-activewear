import { client } from './client';
import { galleryItemsQuery } from './galleryQueries';
import {
  getDecorationTitles,
  normalizeDecorations,
} from '@/sanity/schema/decorationOptions';
import { getBlankTitle } from '@/sanity/schema/blankOptions';

export type GalleryContentType = 'photo' | 'video';

export interface GalleryItem {
  _id: string;
  title: string;
  slug: string;
  contentType: GalleryContentType;
  decoration: string[];
  blankCategory: string | null;
  client: string | null;
  turnaround: string | null;
  quantity: string | null;
  image: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAspect: number | null;
  videoUrl: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  coverAspect: number | null;
  publishedAt: string | null;
}

export interface GalleryFilterParams {
  contentType: GalleryContentType;
  decorationSlugs?: string[];
  blankSlug?: string;
}

export async function getGalleryItems(
  params: GalleryFilterParams
): Promise<GalleryItem[]> {
  if (!client) return [];
  const { contentType, decorationSlugs, blankSlug } = params;
  const data = await client.fetch<GalleryItem[]>(galleryItemsQuery, {
    contentType,
    decorationSlugs: decorationSlugs && decorationSlugs.length > 0 ? decorationSlugs : [],
    blankSlug: blankSlug?.trim() || '',
  });
  return data ?? [];
}

/**
 * In-memory free-text search over gallery items. Scans the human-readable
 * title, decoration names + slugs, blank name + slug, client, turnaround, and
 * quantity. Multiple words are AND-matched (all terms must be present).
 */
export function filterGalleryItemsBySearch(
  items: GalleryItem[],
  query: string | null | undefined
): GalleryItem[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return items;
  const terms = q.split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    const haystack = [
      item.title,
      getDecorationTitles(item.decoration),
      normalizeDecorations(item.decoration).join(' '),
      getBlankTitle(item.blankCategory),
      item.blankCategory ?? '',
      item.client ?? '',
      item.turnaround ?? '',
      item.quantity ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
