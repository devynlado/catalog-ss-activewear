import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Clock,
  Package,
  Palette,
  PenTool,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { getProjectBySlug, getProjectSlugs, getRelatedProjects } from '@/lib/sanity';
import { getServiceUrl, getDecorationTitle, normalizeDecorations, getDecorationTitles } from '@/sanity/schema/decorationOptions';
import { PortableText } from '@/app/components/PortableText';
import { ProjectGallery } from './ProjectGallery';
import { SidebarQuoteCTA, BottomQuoteCTA } from './PortfolioQuoteCTA';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return { title: 'Project Not Found | Garment Decor Portfolio' };
  }
  const title = project.metaTitle || project.title;
  const description =
    project.metaDescription ||
    (project.shortDescription ? project.shortDescription.slice(0, 160) : undefined);
  const image =
    project.featuredImage || (project.gallery && project.gallery[0]) || undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  const url = `${baseUrl}/portfolio/${project.slug}`;

  return {
    title: `${title} | Garment Decor Portfolio`,
    description: description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description ?? undefined,
      type: 'article',
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: project.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PortfolioProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const decorations = normalizeDecorations(project.decoration);
  const relatedProjects = await getRelatedProjects(decorations, project.slug);
  const decorationLabel = getDecorationTitles(decorations);
  const primaryDecoration = decorations[0] ?? 'screen-printing';
  const serviceUrl = getServiceUrl(primaryDecoration);
  const heroImage =
    project.featuredImage || (project.gallery && project.gallery[0]) || null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description:
      project.metaDescription ||
      project.shortDescription ||
      undefined,
    image: heroImage ? [heroImage] : undefined,
    datePublished: project.publishedAt || undefined,
    author: {
      '@type': 'Organization',
      name: 'Garment Decor',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Garment Decor',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/portfolio/${project.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero: solid background + featured image as a contained card */}
      <section className="relative bg-gradient-to-b from-navy-900 to-navy-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            {/* Left: breadcrumb, tags, title, client */}
            <div className="flex-1 min-w-0">
              <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
                <span className="text-white/50">/</span>
                <Link href="/portfolio" className="hover:text-white">
                  Portfolio
                </Link>
                <span className="text-white/50">/</span>
                <span className="text-white font-medium truncate">
                  {project.category?.title ?? decorationLabel}
                </span>
              </nav>
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl max-w-2xl">
                {project.title}
              </h1>
              {project.client && (
                <p className="mt-3 text-lg text-white/80">{project.client}</p>
              )}
            </div>

            {/* Right: featured image (transparent container, full resolution, no crop) */}
            {heroImage && (
              <div className="shrink-0 w-full lg:w-[42%] lg:max-w-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] border-0 bg-transparent">
                  <Image
                    src={heroImage}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                    sizes="100vw"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {project.quantity && (
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
                  <p className="font-bold text-slate-900">{project.quantity}</p>
                </div>
              </div>
            )}
            {project.turnaround && (
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Turnaround</p>
                  <p className="font-bold text-slate-900">{project.turnaround}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-brand-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Decoration</p>
                <p className="font-bold text-slate-900">{decorationLabel}</p>
              </div>
            </div>
            {project.designName && (
              <div className="flex items-center gap-3">
                <PenTool className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Design Name</p>
                  <p className="font-bold text-slate-900">{project.designName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Short Description */}
              {project.shortDescription && (
                <p className="text-lg text-slate-700 mb-8">{project.shortDescription}</p>
              )}

              {/* Image Gallery */}
              {project.gallery && project.gallery.length > 0 && (
                <ProjectGallery images={project.gallery} title={project.title} />
              )}

              {/* Long description */}
              {project.longDescription && project.longDescription.length > 0 && (
                <div className="prose prose-slate prose-lg max-w-none">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">The Story</h2>
                  <PortableText value={project.longDescription as import('@portabletext/types').PortableTextBlock[]} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Product used */}
                {project.product && (
                  <div className="rounded-xl border border-stone-200 overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4">
                      <h3 className="font-semibold text-white">Product Used</h3>
                    </div>
                    <div className="p-6">
                      <p className="font-semibold text-slate-900">{project.product}</p>
                      {project.materials && (
                        <p className="mt-2 text-sm text-slate-600">{project.materials}</p>
                      )}
                      <Link
                        href="/catalog"
                        className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Browse Catalog
                      </Link>
                    </div>
                  </div>
                )}

                {/* Testimony */}
                {project.testimonialQuote && (
                  <blockquote className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-base italic text-white/90">
                      &ldquo;{project.testimonialQuote}&rdquo;
                    </p>
                    <footer className="mt-4 text-sm font-medium text-white/80">
                      — {project.testimonialAuthor ?? 'Client'}
                      {project.testimonialCompany && (
                        <span className="text-white/60">, {project.testimonialCompany}</span>
                      )}
                    </footer>
                  </blockquote>
                )}

                {/* Learn about this service */}
                <div className="rounded-xl border border-stone-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {decorations.length > 1 ? 'Learn About These Services' : 'Learn About This Service'}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Explore our {decorationLabel.toLowerCase()} capabilities.
                  </p>
                  <div className="flex flex-col gap-2">
                    {decorations.map((slug) => (
                      <Link
                        key={slug}
                        href={getServiceUrl(slug)}
                        className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 text-sm"
                      >
                        View {getDecorationTitle(slug)}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <SidebarQuoteCTA
                  defaultDecoration={primaryDecoration}
                  projectTitle={project.title}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related projects (same decoration) */}
      {relatedProjects.length > 0 && (
        <section className="py-12 sm:py-16 bg-stone-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">More {decorationLabel} Projects</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProjects.map((related) => {
                const img = related.featuredImage || related.gallery;
                return (
                  <Link
                    key={related._id}
                    href={`/portfolio/${related.slug}`}
                    className="group rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {img ? (
                        <Image
                          src={img}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
              >
                View All Projects
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <BottomQuoteCTA
        defaultDecoration={primaryDecoration}
        projectTitle={project.title}
      />
    </div>
  );
}
