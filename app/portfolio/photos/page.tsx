import { createPageMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getGalleryItems, filterGalleryItemsBySearch } from '@/lib/sanity';
import { GalleryFilterBar } from '../_gallery/GalleryFilterBar';
import { GalleryGrid } from '../_gallery/GalleryGrid';
import { GalleryPagination } from '../_gallery/GalleryPagination';

export const metadata = createPageMetadata({
  title: 'Photo Gallery | Custom Apparel Portfolio | Garment Decor',
  description:
    'Browse our photo gallery of custom screen printing, embroidery, and apparel decoration projects. Filter by decoration and garment type.',
  path: '/portfolio/photos',
});

export const revalidate = 60;

const ITEMS_PER_PAGE = 30;

type PageProps = {
  searchParams: Promise<{ decoration?: string; blank?: string; q?: string; page?: string }>;
};

export default async function PortfolioPhotosPage({ searchParams }: PageProps) {
  const { decoration, blank, q, page: pageParam } = await searchParams;
  const selectedDecorations = decoration
    ? decoration.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const selectedBlank = blank?.trim() ?? '';
  const searchQuery = q?.trim() ?? '';

  const allItems = await getGalleryItems({
    contentType: 'photo',
    decorationSlugs: selectedDecorations,
    blankSlug: selectedBlank,
  });
  const items = filterGalleryItemsBySearch(allItems, searchQuery);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const rawPage = Math.max(1, parseInt(String(pageParam ?? '1'), 10) || 1);
  const currentPage = Math.min(rawPage, totalPages);
  const pageItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Link
            href="/portfolio"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Photo Gallery
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            A closer look at our custom apparel work
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <GalleryFilterBar
              basePath="/portfolio/photos"
              selectedDecorations={selectedDecorations}
              selectedBlank={selectedBlank}
              searchQuery={searchQuery}
            />
          </div>
          <GalleryGrid items={pageItems} />
          <GalleryPagination
            basePath="/portfolio/photos"
            currentPage={currentPage}
            totalPages={totalPages}
            decoration={decoration}
            blank={selectedBlank}
            q={searchQuery}
          />
        </div>
      </section>
    </div>
  );
}
