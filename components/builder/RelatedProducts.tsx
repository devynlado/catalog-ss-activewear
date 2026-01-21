'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';

interface RelatedProductsProps {
  categoryId?: number;
  brandId?: number;
  currentProductId: string;
  title?: string;
  maxProducts?: number;
  className?: string;
}

export function RelatedProducts({
  categoryId,
  brandId,
  currentProductId,
  title = 'You May Also Like',
  maxProducts = 8,
  className,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchRelated = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId.toString());
        else if (brandId) params.set('brand', brandId.toString());

        const response = await fetch(`/api/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current product and limit results
          const filtered = (data.data || [])
            .filter((p: Product) => p.id !== currentProductId)
            .slice(0, maxProducts);
          setProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId || brandId) {
      fetchRelated();
    }
  }, [categoryId, brandId, currentProductId, maxProducts]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('related-products-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('mt-12', className)}>
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
    <div className={cn('mt-12', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        id="related-products-scroll"
        className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${product.id}`}
            className="group w-56 flex-shrink-0"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title || product.styleName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="224px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
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
                    className="h-3 w-3 rounded-full border border-slate-200"
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
