import { client } from './client';
import { galleryItemsQuery } from './galleryQueries';

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
