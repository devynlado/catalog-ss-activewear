'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export function CartIcon() {
  const { openDrawer, getItemCount, justAdded } = useCartStore();
  const itemCount = getItemCount();

  return (
    <button
      onClick={openDrawer}
      className={`relative rounded-lg p-2 text-slate-600 hover:bg-stone-100 hover:text-slate-900 transition-all ${
        justAdded ? 'scale-110' : ''
      }`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span 
          className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow-sm ${
            justAdded ? 'animate-bounce' : ''
          }`}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
