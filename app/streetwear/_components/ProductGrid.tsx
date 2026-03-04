'use client';

import { useState } from 'react';
import {
  CATEGORIES,
  INITIAL_VISIBLE,
  getProductsByCategory,
  type StreetWearCategory,
} from '@/lib/streetwear-config';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function ProductGrid() {
  const [activeCategory, setActiveCategory] =
    useState<StreetWearCategory>('tshirts');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const allProducts = getProductsByCategory(activeCategory);
  const visible = allProducts.slice(0, visibleCount);
  const remaining = allProducts.length - visibleCount;

  function handleCategoryChange(cat: StreetWearCategory) {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_VISIBLE);
  }

  function handleViewMore() {
    setVisibleCount((prev) => prev + INITIAL_VISIBLE);
  }

  return (
    <section id="products" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Products
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Browse our collection — select the ones you want and get a custom
            quote
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl bg-stone-100 p-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  'rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                  activeCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category Description */}
        <p className="mt-4 text-center text-sm text-slate-500">
          {CATEGORIES.find((c) => c.id === activeCategory)?.description}
          <span className="ml-2 text-slate-400">
            ({allProducts.length} styles)
          </span>
        </p>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View More */}
        {remaining > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleViewMore}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50 hover:shadow-md"
            >
              View More
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {remaining}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
