'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PortfolioItem {
  title: string;
  tags: string[];
  image?: string; // Optional - uses placeholder if not provided
}

interface PortfolioGridProps {
  title: string;
  subtitle?: string;
  items: PortfolioItem[];
  viewAllLink?: string;
}

export function PortfolioGrid({ title, subtitle, items, viewAllLink }: PortfolioGridProps) {
  // Generate gradient colors for placeholders
  const gradients = [
    'from-rose-400 to-orange-300',
    'from-violet-400 to-purple-300',
    'from-cyan-400 to-blue-300',
    'from-emerald-400 to-teal-300',
    'from-amber-400 to-yellow-300',
    'from-pink-400 to-rose-300',
    'from-indigo-400 to-violet-300',
    'from-lime-400 to-green-300',
  ];

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
            )}
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
          {items.slice(0, 8).map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            >
              {/* Placeholder gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`} />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Placeholder icon */}
              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
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
