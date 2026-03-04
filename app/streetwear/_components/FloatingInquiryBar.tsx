'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useStreetWearInquiry } from '@/lib/streetwear-inquiry-store';
import { cn } from '@/lib/utils';

export function FloatingInquiryBar() {
  const { selectedProducts, clearAll } = useStreetWearInquiry();
  const count = selectedProducts.length;

  if (count === 0) return null;

  function handleGetQuote() {
    const el = document.getElementById('inquiry-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 transition-all duration-300',
        count > 0
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      )}
    >
      <div className="border-t border-stone-200 bg-white/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: Selected products */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnails (desktop) */}
            <div className="hidden sm:flex -space-x-2">
              {selectedProducts.slice(0, 4).map((product) => (
                <div
                  key={product.productId}
                  className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-white shadow-sm"
                >
                  <Image
                    src={`/images/streetwear/${product.image}`}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ))}
              {count > 4 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-stone-100 text-xs font-medium text-stone-600 shadow-sm">
                  +{count - 4}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {count} product{count !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={clearAll}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGetQuote}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
            >
              Get Your Quote
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
