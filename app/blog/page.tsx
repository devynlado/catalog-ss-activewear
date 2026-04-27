import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Tag, BookOpen } from 'lucide-react';
import { getBlogArticles, getBlogCategories, estimateReadingTime } from '@/lib/sanity';
import type { BlogArticleListItem } from '@/lib/sanity';
import { getBlogPostPath } from '@/lib/blog-url';
import { BlogPagination } from './BlogPagination';

const POSTS_PER_PAGE = 9;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ArticleCard({ article }: { article: BlogArticleListItem }) {
  const readMin = estimateReadingTime(article.excerpt ? article.excerpt.repeat(3) : null);

  return (
    <Link
      href={getBlogPostPath(article.category?.slug, article.slug)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {article.featuredImage && (
        <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
          <Image
            src={article.featuredImage}
            alt={article.featuredImageAlt || article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {article.category && (
          <span className="mb-2 w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            {article.category.title}
          </span>
        )}
        <h2 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-slate-500">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readMin} min read
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const [articles, categories] = await Promise.all([getBlogArticles(), getBlogCategories()]);

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const isFirstPage = currentPage === 1;

  const featured = isFirstPage ? (articles[0] ?? null) : null;
  const allGridArticles = articles.slice(1);
  const totalGridItems = allGridArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalGridItems / POSTS_PER_PAGE));

  const gridOffset = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedRest = allGridArticles.slice(gridOffset, gridOffset + POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-800 to-navy-900 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6">
            <BookOpen className="h-4 w-4" />
            Blog &amp; Resources
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Tips, Guides &amp; Industry Insights
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Everything you need to know about screen printing, embroidery, custom apparel, and building your brand.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Category pills */}
        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              All
            </Link>
            {categories
              .filter((c) => c.articleCount > 0)
              .map((cat) => (
                <Link
                  key={cat._id}
                  href={`/blog?category=${cat.slug}`}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
                >
                  {cat.title}
                  <span className="ml-1.5 text-slate-400">{cat.articleCount}</span>
                </Link>
              ))}
          </div>
        )}

        {articles.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-700">No articles yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              We&apos;re working on great content. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <Link
                href={getBlogPostPath(featured.category?.slug, featured.slug)}
                className="group mb-12 grid gap-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-lg lg:grid-cols-2"
              >
                {featured.featuredImage && (
                  <div className="relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-stone-100">
                    <Image
                      src={featured.featuredImage}
                      alt={featured.featuredImageAlt || featured.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                )}
                <div className="flex flex-col justify-center p-6 lg:p-10">
                  {featured.category && (
                    <span className="mb-3 w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {featured.category.title}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors lg:text-3xl">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 text-slate-600 leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                    <span>{featured.author}</span>
                    <span>·</span>
                    <span>{formatDate(featured.publishedAt)}</span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:gap-3 transition-all">
                    Read article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}

            {/* Article grid */}
            {paginatedRest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedRest.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            )}

            {/* Bottom Pagination */}
            {totalGridItems > 0 && (
              <div className="mt-12">
                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalGridItems}
                  perPage={POSTS_PER_PAGE}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
