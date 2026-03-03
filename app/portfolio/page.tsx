import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PortfolioCardImage } from './PortfolioCardImage';
import { getProjects, getProjectsFiltered, getCategories } from '@/lib/sanity';
import { PortfolioSearch } from './PortfolioSearch';
import { getDecorationTitle } from '@/sanity/schema/decorationOptions';

export const metadata: Metadata = {
  title: 'Portfolio | Custom Apparel Projects | Garment Decor',
  description:
    'Explore our portfolio of custom screen printing, embroidery, and apparel decoration projects. See the quality of our work for brands, businesses, and events.',
};

export const revalidate = 60;

const PER_PAGE = 9;

type PageProps = { searchParams: Promise<{ category?: string; q?: string; page?: string }> };

function buildPortfolioUrl(params: { category?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.category?.trim()) search.set('category', params.category.trim());
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.page != null && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();
  return `/portfolio${qs ? `?${qs}` : ''}`;
}

export default async function PortfolioPage({ searchParams }: PageProps) {
  const { category: categorySlug, q: searchQ, page: pageParam } = await searchParams;
  const hasSearch = searchQ != null && searchQ.trim().length > 0;

  const [projects, categories] = await Promise.all([
    hasSearch
      ? getProjectsFiltered({ search: (searchQ ?? '').trim(), limit: 500 })
      : getProjects(),
    getCategories(),
  ]);

  const filtered =
    categorySlug && categorySlug.trim()
      ? projects.filter((p) => p.category?.slug === categorySlug.trim())
      : projects;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, parseInt(String(pageParam ?? '1'), 10) || 1)
  );
  const paginatedProjects = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const categoryOptions = [
    { slug: '', title: 'All' },
    ...categories.map((c) => ({ slug: c.slug, title: c.title })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Our Work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Explore real projects we&apos;ve crafted for brands, businesses, events, and creative
            collaborations.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">1M+</p>
              <p className="text-sm text-slate-500">Garments Decorated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">25K+</p>
              <p className="text-sm text-slate-500">Projects Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">15+</p>
              <p className="text-sm text-slate-500">Years Experience</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">4.8★</p>
              <p className="text-sm text-slate-500">Google Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search - same as archive page */}
          <div className="mb-8">
            <PortfolioSearch initialQ={searchQ?.trim() ?? ''} />
          </div>
          {/* Category Filter */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            {categoryOptions.map((cat) => {
              const isActive =
                (cat.slug === '' && !categorySlug) ||
                (cat.slug !== '' && categorySlug === cat.slug);
              return (
                <Link
                  key={cat.slug || 'all'}
                  href={cat.slug ? `/portfolio?category=${cat.slug}` : '/portfolio'}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-700 text-white hover:bg-navy-800'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.title}
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
              <p className="text-slate-600">
                {hasSearch
                  ? 'No projects match your search. Try a different term or clear the search.'
                  : categorySlug
                    ? 'No projects in this category yet.'
                    : 'No projects published yet. Check back soon or '}
                {!categorySlug && !hasSearch && (
                  <>
                    <Link href="/quote" className="font-medium text-brand-600 hover:text-brand-700">
                      request a quote
                    </Link>
                    .
                  </>
                )}
              </p>
              {(categorySlug || hasSearch) && (
                <Link href="/portfolio" className="mt-2 inline-block text-brand-600 font-medium hover:text-brand-700">
                  View all projects
                </Link>
              )}
            </div>
          ) : (
            <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProjects.map((project) => {
                const imageUrl =
                  project.featuredImage || (project.gallery && project.gallery[0]) || null;
                const decorationLabel = getDecorationTitle(project.decoration);
                return (
                  <Link
                    key={project._id}
                    href={`/portfolio/${project.slug}`}
                    className="group rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-stone-200 hover:shadow-lg hover:ring-brand-200 transition-all"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {imageUrl ? (
                        <PortfolioCardImage
                          src={imageUrl}
                          alt={project.title}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1 text-white font-medium text-sm">
                          View Project
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-medium text-brand-600 mb-2">
                        {project.category?.title ?? decorationLabel}
                      </p>
                      <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {project.title}
                      </h3>
                      {project.client && (
                        <p className="mt-2 text-sm text-slate-500">{project.client}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                className="mt-12 flex flex-wrap items-center justify-center gap-2"
                aria-label="Portfolio pagination"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === currentPage;
                  const href = buildPortfolioUrl({
                    category: categorySlug ?? undefined,
                    q: searchQ ?? undefined,
                    page: pageNum,
                  });
                  return (
                    <Link
                      key={pageNum}
                      href={href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-navy-700 text-white hover:bg-navy-800'
                          : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </nav>
            )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Start Your Project?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Get a quote in 2 hours or less. We&apos;ll help bring your vision to life.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-brand-600 shadow-lg transition-all hover:bg-stone-50"
            >
              Request a Quote
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
            >
              <Phone className="h-5 w-5" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
