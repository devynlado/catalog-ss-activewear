'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Phone } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import { formatPrice, cn } from '@/lib/utils';

export function MobileQuoteBar() {
  const { items, openDrawer, justAdded, getItemCount, getSubtotal } = useQuoteStore();
  
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const hasItems = items.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {hasItems ? (
        // State: Items in quote - show quote preview
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
              <span className={`absolute -right-2 -top-2 flex items-center justify-center rounded-full bg-white font-bold text-brand-600 ${itemCount > 99 ? 'h-5 min-w-[2rem] px-1.5 text-[10px]' : 'h-5 w-5 text-xs'}`}>
                {itemCount > 999 ? '999+' : itemCount}
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
      ) : (
        // State: Empty quote - show Call + Get Quote CTAs
        <div className="flex bg-white border-t border-slate-200 shadow-lg">
          <a
            href="tel:+18559427636"
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-200"
          >
            <Phone className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Call Us</span>
          </a>
          <Link
            href="/catalog"
            className="flex flex-1 items-center justify-center gap-2 px-4 py-3 bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="font-semibold">Get Quote</span>
          </Link>
        </div>
      )}
    </div>
  );
}
