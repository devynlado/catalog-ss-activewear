'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Shirt } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

interface CompanionProduct {
  styleId: number;
  styleName: string;
  title: string;
  brandName: string;
  imageUrl: string;
  price: number;
}

interface CompanionProductsProps {
  styleId: number;
  className?: string;
}

export function CompanionProducts({ styleId, className }: CompanionProductsProps) {
  const [companions, setCompanions] = useState<CompanionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch companion products on mount
  useEffect(() => {
    fetch(`/api/products/${styleId}/companions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompanions(data);
        }
      })
      .catch((err) => {
        console.error('Error loading companions:', err);
        setError('Failed to load companion products');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [styleId]);

  // Check scroll state
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
  }, [companions]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 280; // Card width + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Don't render if loading, error, or no companions
  if (loading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || companions.length === 0) {
    return null; // Don't show section if no companions
  }

  return (
    <div className={cn('py-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Complete the Look</h2>
          <p className="text-sm text-slate-500 mt-1">
            Products from the same collection
          </p>
        </div>
        
        {/* Navigation Buttons */}
        {companions.length > 3 && (
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'p-2 rounded-full border transition-colors',
                canScrollLeft
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
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
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {companions.map((product) => (
          <Link
            key={product.styleId}
            href={`/product/${product.styleId}`}
            className="flex-shrink-0 w-[260px] snap-start group"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              {/* Image */}
              <div className="overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    width={260}
                    height={260}
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-slate-50 text-slate-300">
                    <Shirt className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {product.brandName}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {product.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Style #{product.styleName}
                </p>
                {product.price > 0 && (
                  <p className="mt-2 text-sm font-bold text-brand-600">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
