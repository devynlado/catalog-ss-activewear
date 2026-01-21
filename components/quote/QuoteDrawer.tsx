'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function QuoteDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity } = useQuoteStore();
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (!isDrawerOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">Quote List</h2>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {items.length} items
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <ShoppingBag className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                Your quote is empty
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Browse our catalog and add items to your quote list.
              </p>
              <Button onClick={closeDrawer} className="mt-6">
                Browse Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-slate-100 bg-white p-4"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">{item.brandName}</p>
                    <h4 className="font-medium text-slate-900">{item.styleName}</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.colorName} / {item.sizeName}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-600">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-md border border-slate-200 p-1 hover:bg-slate-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-md border border-slate-200 p-1 hover:bg-slate-50"
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
          <div className="border-t border-slate-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Estimated Subtotal</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              * Final pricing will be confirmed in your quote
            </p>
            <Link href="/quote" onClick={closeDrawer}>
              <Button className="w-full" size="lg">
                Review & Submit Quote
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Fragment>
  );
}
