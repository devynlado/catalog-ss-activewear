'use client';

import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Category } from '@/lib/types';

interface ProductBreadcrumbsProps {
  brandName: string;
  brandId: number;
  styleName: string;
  categories?: Category[];
  baseCategory?: string;
}

// Map of category IDs to names for common categories
const CATEGORY_MAP: Record<number, string> = {
  1: 'T-Shirts',
  3: 'Fleece',
  5: 'Polos',
  7: 'Outerwear',
  11: 'Headwear',
  14: 'Bottoms',
  19: 'Bags',
  21: 'Accessories',
};

export function ProductBreadcrumbs({
  brandName,
  brandId,
  styleName,
  categories = [],
  baseCategory,
}: ProductBreadcrumbsProps) {
  // Find the primary category (first one that's a main category)
  const mainCategoryIds = Object.keys(CATEGORY_MAP).map(Number);
  const primaryCategory = categories.find(c => mainCategoryIds.includes(c.id));
  const primaryCategoryId = primaryCategory?.id;
  const primaryCategoryName = primaryCategoryId 
    ? CATEGORY_MAP[primaryCategoryId] 
    : baseCategory || null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {/* Back to Catalog */}
        <li>
          <Link
            href="/catalog"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalog</span>
          </Link>
        </li>

        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />

        {/* Primary Category (if found) */}
        {primaryCategoryId && primaryCategoryName && (
          <>
            <li>
              <Link
                href={`/catalog?category=${primaryCategoryId}`}
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                {primaryCategoryName}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
          </>
        )}

        {/* Brand - use brand name for SEO-friendly URL */}
        <li>
          <Link
            href={`/catalog?brand=${encodeURIComponent(brandName)}`}
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            {brandName}
          </Link>
        </li>

        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />

        {/* Current Product (Style Name) */}
        <li>
          <span className="text-slate-900 font-medium">{styleName}</span>
        </li>
      </ol>
    </nav>
  );
}
