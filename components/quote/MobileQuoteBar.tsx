'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import { formatPrice, cn } from '@/lib/utils';

export function MobileQuoteBar() {
  const { items, openDrawer, justAdded, getItemCount, getSubtotal } = useQuoteStore();
  
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  // Don't show if no items
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <button
        onClick={openDrawer}
        className={cn(
          "flex w-full items-center justify-between bg-brand-500 px-4 py-3 text-white shadow-lg transition-all",
          justAdded && "animate-pulse bg-brand-600"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">View Quote</p>
            <p className="text-xs text-brand-100">{items.length} product{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
          <ArrowRight className="h-5 w-5" />
        </div>
      </button>
    </div>
  );
}
