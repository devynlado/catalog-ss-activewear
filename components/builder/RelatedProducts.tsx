'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';

interface RelatedProductsProps {
  styleId?: number;        // For comparableGroup lookup (preferred)
  categoryId?: number;     // Fallback: products from same category
  brandId?: number;        // Fallback: products from same brand
  currentProductId: string;
  title?: string;
  maxProducts?: number;
  className?: string;
}

export function RelatedProducts({
  styleId,
  categoryId,
  brandId,
  currentProductId,
  title = 'Similar Products',
  maxProducts = 8,
  className,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchRelated = async () => {
      setIsLoading(true);
      try {
        let fetchedProducts: Product[] = [];
        
        // Priority 1: Use comparableGroup if styleId provided
        if (styleId) {
          const response = await fetch(`/api/products/${styleId}/comparable`);
          if (response.ok) {
            fetchedProducts = await response.json();
          }
        }
        
        // Fallback to category/brand if no comparable products found
        if (fetchedProducts.length === 0 && (categoryId || brandId)) {
          const params = new URLSearchParams();
          if (categoryId) params.set('category', categoryId.toString());
          else if (brandId) params.set('brand', brandId.toString());

          const response = await fetch(`/api/products?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            fetchedProducts = data.data || [];
          }
        }
        
        // Filter out current product and limit results
        const filtered = fetchedProducts
          .filter((p: Product) => p.id !== currentProductId)
          .slice(0, maxProducts);
        setProducts(filtered);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (styleId || categoryId || brandId) {
      fetchRelated();
    }
  }, [styleId, categoryId, brandId, currentProductId, maxProducts]);

  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="mt-6 flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-56 flex-shrink-0 animate-pulse">
              <div className="aspect-square rounded-xl bg-slate-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {products.length > 3 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'p-2 rounded-full border transition-colors',
                canScrollLeft
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-stone-200 text-slate-300 cursor-not-allowed'
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'p-2 rounded-full border transition-colors',
                canScrollRight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-stone-200 text-slate-300 cursor-not-allowed'
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group w-56 flex-shrink-0"
          >
            <div className="overflow-hidden rounded-xl border border-stone-200">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title || product.styleName}
                  width={224}
                  height={224}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-stone-50 text-slate-300">
                  <ShoppingBag className="h-12 w-12" />
                </div>
              )}
            </div>
            
            {/* Color count badge */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                {product.colors.slice(0, 4).map((color) => (
                  <span
                    key={color.colorCode}
                    className="h-3 w-3 rounded-full border border-stone-200"
                    style={{ 
                      backgroundImage: color.swatchImage ? `url(${color.swatchImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundColor: !color.swatchImage ? '#e2e8f0' : undefined
                    }}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-xs text-slate-500">+{product.colors.length - 4}</span>
                )}
              </div>
            )}

            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {product.brandName}
            </p>
            <h3 className="mt-1 text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-brand-600">
              {product.title || product.styleName}
            </h3>
            {product.price > 0 && (
              <p className="mt-1 font-semibold text-slate-900">
                {formatPrice(product.price)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RelatedProducts;
