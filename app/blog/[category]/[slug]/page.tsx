import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  User,
  CalendarDays,
  ArrowRight,
  FolderOpen,
  MessageCircle,
} from 'lucide-react';
import {
  getBlogArticleBySlug,
  getBlogArticleSlugs,
  getBlogRelatedArticles,
  getBlogCategories,
  getProjects,
  estimateReadingTime,
  getAutoMetaDescription,
} from '@/lib/sanity';
import { getSiteUrl } from '@/lib/metadata';
import { getBlogPostPath } from '@/lib/blog-url';
import { PortableText } from '@/app/components/PortableText';
import { PortfolioCardImage } from '@/app/portfolio/PortfolioCardImage';
import { getDecorationTitles } from '@/sanity/schema/decorationOptions';

type Props = { params: Promise<{ category: string; slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const entries = await getBlogArticleSlugs();
  return entries
    .filter((e) => e.categorySlug)
    .map((e) => ({ category: e.categorySlug!, slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found | Garment Decor' };

  const base = getSiteUrl();
  const url = `${base}${getBlogPostPath(article.category?.slug, article.slug)}`;
  const title = article.metaTitle || `${article.title} | Garment Decor Blog`;
  const description = getAutoMetaDescription(article);
  const image = article.featuredImage || `${base}/images/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Garment Decor',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);
  if (!article) notFound();

  const [related, categories, allProjects] = await Promise.all([
    getBlogRelatedArticles(slug),
    getBlogCategories(),
    getProjects(),
  ]);

  const portfolioItems = allProjects.slice(0, 4);

  const readMin = estimateReadingTime(article.plainBody);
  const base = getSiteUrl();
  const url = `${base}${getBlogPostPath(article.category?.slug, article.slug)}`;
  const description = getAutoMetaDescription(article);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    image: article.featuredImage || undefined,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Organization',
      name: article.author,
      url: base,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Garment Decor',
      url: base,
      logo: { '@type': 'ImageObject', url: `${base}/images/brand/logo-circle-dark.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const activeCategories = categories.filter((c) => c.articleCount > 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-stone-50">
        {/* Featured image hero */}
        {article.featuredImage && (
          <div className="relative h-64 sm:h-80 lg:h-[28rem] bg-stone-900">
            <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt || article.title}
              fill
              className="object-cover opacity-80"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        {/* Two-column layout */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            {/* ── Main Content ── */}
            <article className="lg:col-span-2">
              {/* Header card — overlaps hero */}
              <header className={article.featuredImage ? '-mt-24 relative z-10' : 'pt-12'}>
                <div className="rounded-2xl bg-white p-6 shadow-xl shadow-stone-200/60 sm:p-10">
                  <Link
                    href="/blog"
                    className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Blog
                  </Link>

                  {article.category && (
                    <span className="mb-3 block w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {article.category.title}
                    </span>
                  )}

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl leading-tight">
                    {article.title}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {readMin} min read
                    </span>
                  </div>
                </div>
              </header>

              {/* Article body */}
              <div className="mt-10 pb-16 rounded-2xl bg-white p-6 sm:p-10 shadow-sm shadow-stone-200/60 prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-brand-600 prose-img:rounded-xl">
                <PortableText value={article.body as any} />
              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="mt-10 lg:mt-0 lg:pt-0 pb-16">
              <div
                className={`lg:sticky lg:top-24 space-y-6 ${article.featuredImage ? 'lg:pt-8' : 'lg:pt-12'}`}
              >
                {/* Categories */}
                {activeCategories.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                      <FolderOpen className="h-4 w-4" />
                      Categories
                    </h3>
                    <ul className="space-y-1">
                      {activeCategories.map((cat) => {
                        const isActive = article.category?.slug === cat.slug;
                        return (
                          <li key={cat._id}>
                            <Link
                              href={`/blog?category=${cat.slug}`}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                                isActive
                                  ? 'bg-brand-50 text-brand-700 font-medium'
                                  : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                              }`}
                            >
                              {cat.title}
                              <span
                                className={`text-xs ${isActive ? 'text-brand-500' : 'text-slate-400'}`}
                              >
                                {cat.articleCount}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Related Posts */}
                {related.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                      Related Articles
                    </h3>
                    <div className="space-y-4">
                      {related.map((r) => (
                        <Link
                          key={r._id}
                          href={getBlogPostPath(r.category?.slug, r.slug)}
                          className="group flex gap-3"
                        >
                          {r.featuredImage && (
                            <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              <Image
                                src={r.featuredImage}
                                alt={r.featuredImageAlt || r.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="80px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                              {r.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(r.publishedAt)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="rounded-xl bg-gradient-to-br from-navy-700 to-navy-800 p-6 text-white shadow-lg shadow-navy-800/30">
                  <MessageCircle className="h-8 w-8 mb-3 opacity-90" />
                  <h3 className="text-lg font-bold leading-snug text-white">
                    Need more information about our services?
                  </h3>
                  <p className="mt-2 text-sm text-white/80 leading-relaxed">
                    Custom screen printing, embroidery, and more. We&apos;re here to help bring
                    your vision to life.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:gap-3"
                  >
                    Let&apos;s Talk
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Portfolio showcase */}
        {portfolioItems.length > 0 && (
          <section className="mt-10 border-t border-stone-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    See Our Work in Action
                  </h2>
                  <p className="mt-2 text-slate-500">
                    Real projects crafted for brands, businesses, and events.
                  </p>
                </div>
                <Link
                  href="/portfolio"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors hover:gap-3"
                >
                  View All Projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                {portfolioItems.map((project) => {
                  const imageUrl =
                    project.featuredImage || (project.gallery && project.gallery[0]) || null;
                  const decorationLabel = getDecorationTitles(project.decoration);
                  return (
                    <Link
                      key={project._id}
                      href={`/portfolio/${project.slug}`}
                      className="group rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-stone-200 hover:shadow-lg hover:ring-brand-200 transition-all"
                    >
                      <div className="relative aspect-square bg-stone-100">
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
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-white font-medium text-sm">
                            View Project
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <p className="text-xs font-medium text-brand-600 mb-1.5">
                          {project.category?.title ?? decorationLabel}
                        </p>
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-brand-600 transition-colors">
                          {project.title}
                        </h3>
                        {project.client && (
                          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">{project.client}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 text-center sm:hidden">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  View All Projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
