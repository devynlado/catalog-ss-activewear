'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface CategoryLink {
  name: string;
  href: string;
  description?: string;
}

interface ShopBlanksSectionProps {
  title: string;
  subtitle?: string;
  categories: CategoryLink[];
}

export function ShopBlanksSection({ title, subtitle, categories }: ShopBlanksSectionProps) {
  return (
    <section className="py-16 lg:py-20 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group inline-flex items-center gap-3 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-brand-500 hover:text-white"
            >
              {category.name}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors"
          >
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
