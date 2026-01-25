'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Shirt, Star } from 'lucide-react';

interface CategoryLink {
  name: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ShopBlanksSectionProps {
  title: string;
  subtitle?: string;
  categories: CategoryLink[];
  serviceSlug?: string;
}

// Popular products to highlight
const featuredProducts = [
  { name: 'Gildan 5000', desc: 'Heavy Cotton Tee', category: 'T-Shirts' },
  { name: 'Bella+Canvas 3001', desc: 'Unisex Jersey Tee', category: 'T-Shirts' },
  { name: 'Gildan 18000', desc: 'Heavy Blend Crewneck', category: 'Fleece' },
];

export function ShopBlanksSection({ title, subtitle, categories, serviceSlug }: ShopBlanksSectionProps) {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-brand-600 mb-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Shop Blanks</span>
          </div>
          <h2 className="text-3xl font-bold text-navy-800">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
          )}
        </div>

        {/* Category Cards - Larger, more prominent */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {categories.slice(0, 6).map((category, index) => (
            <Link
              key={index}
              href={serviceSlug ? `${category.href}&service=${serviceSlug}` : category.href}
              className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-900">{category.name}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Products Highlight */}
        <div className="bg-brand-50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-brand-900">Popular Choices</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <Link
                key={index}
                href={`/catalog?search=${encodeURIComponent(product.name.split(' ')[1])}`}
                className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                  <Shirt className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Strong CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={serviceSlug ? `/catalog?service=${serviceSlug}` : '/catalog'}
            className="inline-flex items-center justify-center gap-2 bg-brand-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
          >
            <ShoppingBag className="h-5 w-5" />
            Start Building Your Quote
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-slate-600 font-medium hover:text-brand-600 transition-colors"
          >
            See Pricing First
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
