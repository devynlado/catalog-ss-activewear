'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface PortfolioProject {
  _id: string;
  title: string;
  slug: string;
  client: string | null;
  decoration: string | string[];
  category: { title: string; slug: string } | null;
  featuredImage: string | null;
}

interface DynamicPortfolioGridProps {
  title: string;
  subtitle?: string;
  decorationSlug: string | string[];
  limit?: number;
  viewAllLink?: string;
}

export function DynamicPortfolioGrid({
  title,
  subtitle,
  decorationSlug,
  limit = 8,
  viewAllLink = '/portfolio',
}: DynamicPortfolioGridProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  const slugParam = Array.isArray(decorationSlug) ? decorationSlug.join(',') : decorationSlug;

  useEffect(() => {
    fetch(`/api/portfolio/by-decoration?decoration=${slugParam}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => setProjects(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [decorationSlug, limit]);

  if (loading) {
    return (
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
          {subtitle && <p className="mt-2 text-lg text-slate-600">{subtitle}</p>}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
            {subtitle && <p className="mt-2 text-lg text-slate-600">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="hidden sm:inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/portfolio/${project.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              {project.featuredImage ? (
                <Image
                  src={project.featuredImage}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-stone-500 text-sm">
                  No image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {project.title}
                </h3>
                {project.client && (
                  <p className="text-white/70 text-xs mt-1">{project.client}</p>
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  View Project <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {viewAllLink && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
