'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ArchiveProductCategory } from '@/lib/portfolio-product-categories';

type DecorationOption = { title: string; value: string };

type Props = {
  productCategories: ArchiveProductCategory[];
  decorationOptions: DecorationOption[];
  initialProductCategorySlugs: string[];
  initialDecorationSlugs: string[];
};

export function ArchiveFilterBar({
  productCategories,
  decorationOptions,
  initialProductCategorySlugs,
  initialDecorationSlugs,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [productCategorySlugs, setProductCategorySlugs] = useState<string[]>(
    initialProductCategorySlugs
  );
  const [decorationSlugs, setDecorationSlugs] = useState<string[]>(initialDecorationSlugs);

  useEffect(() => {
    const product = searchParams.get('product');
    setProductCategorySlugs(product ? product.split(',').filter(Boolean) : []);
    const dec = searchParams.get('decoration');
    setDecorationSlugs(dec ? dec.split(',').filter(Boolean) : []);
  }, [searchParams]);

  const buildUrl = (
    updates: { product?: string[]; decoration?: string[] }
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const newProduct =
      updates.product !== undefined ? updates.product : productCategorySlugs;
    const newDec =
      updates.decoration !== undefined ? updates.decoration : decorationSlugs;
    if (newProduct.length) params.set('product', newProduct.join(','));
    else params.delete('product');
    if (newDec.length) params.set('decoration', newDec.join(','));
    else params.delete('decoration');
    const query = params.toString();
    return query ? `/portfolio/archive?${query}` : '/portfolio/archive';
  };

  const applyUrl = (updates: { product?: string[]; decoration?: string[] }) => {
    router.push(buildUrl(updates));
  };

  const toggleProductCategory = (slug: string) => {
    const next = productCategorySlugs.includes(slug)
      ? productCategorySlugs.filter((s) => s !== slug)
      : [...productCategorySlugs, slug];
    setProductCategorySlugs(next);
    applyUrl({ product: next });
  };

  const toggleDecoration = (value: string) => {
    const next = decorationSlugs.includes(value)
      ? decorationSlugs.filter((s) => s !== value)
      : [...decorationSlugs, value];
    setDecorationSlugs(next);
    applyUrl({ decoration: next });
  };

  const clearAll = () => {
    setProductCategorySlugs([]);
    setDecorationSlugs([]);
    router.push('/portfolio/archive');
  };

  const hasActiveFilters =
    productCategorySlugs.length > 0 || decorationSlugs.length > 0;

  return (
    <div className="sticky top-0 z-10 border-b-0 border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-[40px] pb-4">
        <div className="flex flex-col gap-6">
          {/* Decoration */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 shrink-0 w-full sm:w-auto">
              Decoration
            </span>
            <div className="flex flex-wrap gap-2">
              {decorationOptions.map((opt) => {
                const selected = decorationSlugs.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDecoration(opt.value)}
                    className={`
                      rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                      ${
                        selected
                          ? 'bg-navy-700 text-white'
                          : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                      }
                    `}
                  >
                    {opt.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product used */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 shrink-0 w-full sm:w-auto">
              Product used
            </span>
            <div className="flex flex-wrap gap-2">
              {productCategories.map((cat) => {
                const selected = productCategorySlugs.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleProductCategory(cat.slug)}
                    className={`
                      rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                      ${
                        selected
                          ? 'bg-brand-600 text-white'
                          : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                      }
                    `}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <>
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
            <p className="mt-1 text-xs text-stone-500">
              Multiple selections allowed. Results update as you change filters.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
