'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  layout?: 'horizontal' | 'vertical' | 'grid';
  showIcons?: boolean;
  maxVisible?: number;
  className?: string;
}

export function CategoryNav({
  layout = 'horizontal',
  showIcons = false,
  maxVisible = 10,
  className,
}: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className={cn('flex gap-2', className)}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 animate-pulse rounded-full bg-slate-200"
          />
        ))}
      </div>
    );
  }

  const displayCategories = categories.slice(0, maxVisible);

  const layouts = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-1',
    grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4',
  };

  const itemStyles = {
    horizontal: cn(
      'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
      'border border-slate-200 hover:border-brand-500 hover:text-brand-600'
    ),
    vertical: cn(
      'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
      'hover:bg-slate-50'
    ),
    grid: cn(
      'flex items-center justify-center rounded-xl p-4 text-center text-sm font-medium transition-colors',
      'border border-slate-200 hover:border-brand-500 hover:text-brand-600'
    ),
  };

  const activeStyles = {
    horizontal: 'border-brand-500 bg-brand-50 text-brand-600',
    vertical: 'bg-brand-50 text-brand-600',
    grid: 'border-brand-500 bg-brand-50 text-brand-600',
  };

  return (
    <nav className={cn(layouts[layout], className)}>
      {/* All Products */}
      <Link
        href="/catalog"
        className={cn(
          itemStyles[layout],
          !activeCategory && activeStyles[layout]
        )}
      >
        All Products
        {layout === 'vertical' && <ChevronRight className="h-4 w-4" />}
      </Link>

      {/* Category Links */}
      {displayCategories.map((category) => (
        <Link
          key={category.id}
          href={`/catalog?category=${category.id}`}
          className={cn(
            itemStyles[layout],
            activeCategory === category.id.toString() && activeStyles[layout]
          )}
        >
          {category.name}
          {layout === 'vertical' && <ChevronRight className="h-4 w-4" />}
        </Link>
      ))}

      {/* Show More (for horizontal layout) */}
      {layout === 'horizontal' && categories.length > maxVisible && (
        <Link
          href="/catalog"
          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          +{categories.length - maxVisible} more
        </Link>
      )}
    </nav>
  );
}

// Default export for Builder.io
export default CategoryNav;
