import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { PortfolioCardImage } from '../PortfolioCardImage';
import { getProjectsFiltered } from '@/lib/sanity';
import { getArchiveProductCategories } from '@/lib/portfolio-product-categories';
import { getDecorationTitle } from '@/sanity/schema/decorationOptions';
import { DECORATION_OPTIONS } from '@/sanity/schema/decorationOptions';
import { ArchiveFilterBar } from './ArchiveFilterBar';
import { ArchiveHeroActions } from './ArchiveHeroActions';

export const metadata: Metadata = {
  title: 'Project Archive | Recent Work | Garment Decor',
  description:
    'Browse our most recent custom screen printing, embroidery, and decoration projects. Filter by decoration and product used, or search. Updated automatically as we publish new work.',
};

export const revalidate = 60;

const ARCHIVE_SIZE = 9;

type PageProps = {
  searchParams: Promise<{ q?: string; product?: string; decoration?: string }>;
};

export default async function PortfolioArchivePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const productCategorySlugs = params.product
    ? params.product.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const decorationSlugs = params.decoration
    ? params.decoration.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [projects, productCategories] = await Promise.all([
    getProjectsFiltered({
      search: q || undefined,
      productCategorySlugs:
        productCategorySlugs.length ? productCategorySlugs : undefined,
      decorationSlugs:
        decorationSlugs.length ? decorationSlugs : undefined,
      limit: ARCHIVE_SIZE,
    }),
    Promise.resolve(getArchiveProductCategories()),
  ]);

  const decorationOptions = DECORATION_OPTIONS.map((o) => ({
    title: o.title,
    value: o.value,
  }));
  const hasActiveFilters =
    q || productCategorySlugs.length > 0 || decorationSlugs.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero: title + search & View all link in same column */}
      <section className="border-b border-stone-200 bg-gradient-to-b from-stone-50 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="sm:w-[60%] sm:min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-600 mb-2">
                <LayoutGrid className="h-4 w-4" />
                Project Archive
              </div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                Recent Work
              </h1>
              <p className="mt-2 text-slate-600 max-w-xl">
                Our latest projects, updated whenever we publish something new.
                Filter by decoration or product used, or search. Click any card
                to read the full story.
              </p>
            </div>
            <div className="sm:w-[40%] sm:min-w-0 shrink-0">
              <ArchiveHeroActions initialQ={q} />
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar: Decoration + Product used (single column, no bottom border) */}
      <ArchiveFilterBar
        productCategories={productCategories}
        decorationOptions={decorationOptions}
        initialProductCategorySlugs={productCategorySlugs}
        initialDecorationSlugs={decorationSlugs}
      />

      {/* Bento grid: 1 large (2x2) + 1 tall (1x2) + 6 standard + 1 full-width (when 9 items) */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
              <p className="text-slate-600">
                {hasActiveFilters
                  ? 'No projects match your filters or search. Try changing or clearing them.'
                  : 'No projects published yet. Check back soon.'}
              </p>
              <Link
                href={hasActiveFilters ? '/portfolio/archive' : '/portfolio'}
                className="mt-4 inline-block text-brand-600 font-medium hover:text-brand-700"
              >
                {hasActiveFilters ? 'Clear filters' : 'Back to portfolio'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:auto-rows-fr">
              {projects.map((project, index) => {
                const imageUrl =
                  project.featuredImage || (project.gallery && project.gallery[0]) || null;
                const decorationLabel = getDecorationTitle(project.decoration);
                const isFeatured = index === 0;
                const isTall = index === 1;
                const isWideBottom = index === 8 && projects.length === 9;

                return (
                  <Link
                    key={project._id}
                    href={`/portfolio/${project.slug}`}
                    className={`
                      group relative overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200/80
                      transition-all duration-300 hover:ring-brand-300 hover:shadow-xl hover:shadow-brand-500/10
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                      min-h-[220px] sm:min-h-[260px]
                      ${isFeatured ? 'lg:col-span-2 lg:row-span-2 lg:min-h-[360px]' : ''}
                      ${isTall ? 'lg:col-span-1 lg:row-span-2 lg:min-h-[360px]' : ''}
                      ${isWideBottom ? 'lg:col-span-2' : ''}
                    `}
                  >
                    <div className="absolute inset-0">
                      {imageUrl ? (
                        <PortfolioCardImage
                          src={imageUrl}
                          alt={project.title}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes={
                            isFeatured
                              ? '(max-width: 1024px) 100vw, 66vw'
                              : isTall
                                ? '(max-width: 1024px) 100vw, 33vw'
                                : isWideBottom
                                  ? '(max-width: 1024px) 100vw, 66vw'
                                  : '(max-width: 1024px) 100vw, 33vw'
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
                          No image
                        </div>
                      )}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                          opacity-90 group-hover:opacity-95 transition-opacity"
                      />
                    </div>

                    <div className="relative flex flex-col justify-end h-full p-4 sm:p-5 lg:p-6">
                      <p className="text-xs font-medium text-white/90 uppercase tracking-wider mb-1">
                        {project.category?.title ?? decorationLabel}
                      </p>
                      <h2
                        className={`font-semibold text-white leading-tight line-clamp-2 group-hover:text-brand-200 transition-colors
                          ${isFeatured ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-base sm:text-lg'}
                          ${isTall ? 'text-base sm:text-lg' : ''}`}
                      >
                        {project.title}
                      </h2>
                      {project.client && (
                        <p className="mt-1 text-sm text-white/80 line-clamp-1">{project.client}</p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                        View project
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-stone-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 mb-4">
            Want to see everything? Filter by decoration or product, or browse the full list.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-700"
          >
            Full portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
