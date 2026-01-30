'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className }: CartIconProps) {
  const { items, openDrawer, justAdded } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={openDrawer}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-200",
        "text-slate-600 hover:text-brand-600 hover:bg-brand-50",
        justAdded && "animate-bounce",
        className
      )}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      
      {itemCount > 0 && (
        <span 
          className={cn(
            "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center",
            "rounded-full bg-brand-500 text-[10px] font-bold text-white",
            "ring-2 ring-white",
            justAdded && "animate-pulse"
          )}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
