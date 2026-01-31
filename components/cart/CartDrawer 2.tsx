'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight, Sparkles, CheckCircle, Truck, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore, getNextVolumeThreshold } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Quick category links for empty state
const quickCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Fleece', href: '/catalog?category=9' },
  { name: 'Polos', href: '/catalog?category=52' },
  { name: 'Headwear', href: '/catalog?category=11' },
];

// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 500;

// Calculate estimated delivery (3-5 business days for economy)
function getEstimatedDelivery(): string {
  const now = new Date();
  
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    return result;
  };
  
  const minDate = addBusinessDays(now, 3);
  const maxDate = addBusinessDays(now, 5);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`;
}

export function CartDrawer() {
  const { 
    items, 
    isDrawerOpen, 
    closeDrawer, 
    removeItem, 
    updateQuantity,
    getTotalUnits,
    getSubtotal,
  } = useCartStore();
  const router = useRouter();
  const subtotal = getSubtotal();
  const totalUnits = getTotalUnits();
  const nextThreshold = getNextVolumeThreshold(totalUnits);
  
  const handleBrowseCatalog = () => {
    closeDrawer();
    router.push('/catalog');
  };
  
  const handleCategoryClick = (href: string) => {
    closeDrawer();
    router.push(href);
  };

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-gradient-to-b from-white via-stone-50 to-stone-100 shadow-2xl shadow-stone-900/20 overflow-hidden"
          >
        {/* Subtle grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-40 h-40 w-40 rounded-full bg-navy-800/5 blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-stone-200/70 bg-gradient-to-r from-stone-50/80 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm shadow-brand-500/25">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Cart</h2>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/50">
              {totalUnits} {totalUnits === 1 ? 'piece' : 'pieces'}
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
                <ShoppingCart className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Browse our catalog and add blank apparel to your cart.
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
                  className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image - Clickable */}
                  <Link
                    href={`/product/${item.styleId}`}
                    onClick={closeDrawer}
                    className="relative w-16 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-lg bg-white border border-stone-200 hover:border-brand-300 transition-colors"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.styleName}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">{item.brandName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/product/${item.styleId}`}
                        onClick={closeDrawer}
                        className="font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {item.styleName}
                        <span className="text-slate-400 font-normal"> × </span>
                        <span className="font-bold text-brand-600">{item.quantity}</span>
                      </Link>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 border border-green-100">
                        <CheckCircle className="h-2.5 w-2.5" />
                        In Stock
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.colorName} / {item.sizeName}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        {formatPrice(item.unitPrice)} each
                      </p>
                      <Link
                        href={`/product/${item.styleId}`}
                        onClick={closeDrawer}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
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
                        className="rounded-md border border-stone-200 bg-white p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Minus className="h-3 w-3 text-slate-600" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-800 bg-stone-50 rounded-md px-2 py-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-md border border-stone-200 bg-white p-1.5 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      >
                        <Plus className="h-3 w-3 text-slate-600" />
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
            {/* Estimated Delivery */}
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-slate-600">Est. delivery:</span>
              <span className="font-semibold text-slate-800">{getEstimatedDelivery()}</span>
            </div>

            {/* Free Shipping Progress or Volume Discount */}
            {subtotal < FREE_SHIPPING_THRESHOLD ? (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900">
                      ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(0)} away from FREE shipping
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-blue-600">
                  {formatPrice(subtotal)} / {formatPrice(FREE_SHIPPING_THRESHOLD)}
                </p>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/80 px-3 py-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-800">FREE shipping unlocked!</span>
              </div>
            )}

            {/* Volume Discount Hint - show if applicable and not already showing shipping */}
            {nextThreshold && subtotal >= FREE_SHIPPING_THRESHOLD && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-3 py-2.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    Add {nextThreshold.unitsNeeded} more to unlock {nextThreshold.label}
                  </p>
                  <p className="text-[10px] text-amber-600">
                    Volume pricing at {nextThreshold.threshold}+ pieces
                  </p>
                </div>
              </div>
            )}

            {/* Subtotal card */}
            <div className="mb-4 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-4 border border-stone-200/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {totalUnits} pieces
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Shipping & tax calculated at checkout
              </p>
            </div>
            
            <Button 
              onClick={handleCheckout}
              className="w-full shadow-lg shadow-brand-500/25" 
              size="lg"
            >
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <button
              onClick={closeDrawer}
              className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
