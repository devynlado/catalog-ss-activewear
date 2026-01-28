'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/lib/quote-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Quick category links for empty state
const quickCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Fleece', href: '/catalog?category=9' },
  { name: 'Polos', href: '/catalog?category=52' },
  { name: 'Headwear', href: '/catalog?category=11' },
];

export function QuoteDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity } = useQuoteStore();
  const router = useRouter();
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  
  const handleBrowseCatalog = () => {
    closeDrawer();
    router.push('/catalog');
  };
  
  const handleCategoryClick = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  if (!isDrawerOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl shadow-stone-900/20 overflow-hidden">
        {/* Subtle grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-40 h-40 w-40 rounded-full bg-navy-800/5 blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-stone-200/70 bg-gradient-to-r from-stone-50/80 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Quote List</h2>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/50">
              {items.length} items
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-gradient-to-br from-stone-100 to-stone-200 p-5 shadow-inner">
                <ShoppingBag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Your quote is empty
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Browse our catalog and add items to your quote list.
              </p>
              <Button onClick={handleBrowseCatalog} className="mt-6 shadow-md shadow-brand-500/20">
                Browse Catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {/* Quick category links */}
              <div className="mt-8 w-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Quick Links
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.href)}
                      className="rounded-full border border-stone-200 bg-white/70 px-3.5 py-1.5 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 transition-all shadow-sm"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-stone-200/70 bg-white/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200/50">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.styleName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-600">{item.brandName}</p>
                    <h4 className="font-semibold text-slate-900 truncate">{item.styleName}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.colorName} / {item.sizeName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-600">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="relative z-10 border-t border-stone-200/70 bg-gradient-to-t from-stone-50/80 to-white p-6">
            {/* Subtotal card */}
            <div className="mb-4 rounded-xl bg-gradient-to-br from-brand-50/80 to-brand-100/50 backdrop-blur-sm p-4 border border-brand-200/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Estimated Subtotal</span>
                <span className="text-xl font-bold text-brand-700">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                * Final pricing will be confirmed in your quote
              </p>
            </div>
            <Link href="/quote" onClick={closeDrawer}>
              <Button className="w-full shadow-lg shadow-brand-500/25" size="lg">
                Review & Submit Quote
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Fragment>
  );
}
