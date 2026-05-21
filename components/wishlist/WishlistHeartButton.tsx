'use client';

/**
 * Reusable "heart" toggle button for the wishlist. Used in three places:
 *
 *   - <ProductCard />     (variant="card")     small circular pill in the
 *                                              top-right corner of the card
 *   - <ProductDetailClient /> (variant="pdp")  pill-shaped, right-aligned
 *                                              next to the product title
 *   - <Header />          (variant="header")   icon button beside cart with
 *                                              its own count badge handled
 *                                              by the parent
 *
 * The button is intentionally optimistic: the visual flip happens on click
 * regardless of server state. The store handles the network call and
 * reverts on hard failure (anonymous 401s are NOT failures — those just
 * stay in localStorage).
 *
 * Animation: scale-bounce + heart-fill colour swap, ~200ms. No toast — the
 * heart filling/unfilling IS the feedback. The header count badge updates
 * in the same frame because Zustand state is shared.
 */

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';
import { cn } from '@/lib/utils';

type Variant = 'card' | 'pdp' | 'page';

interface WishlistHeartButtonProps {
  styleId: number;
  variant?: Variant;
  className?: string;
  // Some surfaces (PDP) want a text label beside the heart.
  showLabel?: boolean;
}

export function WishlistHeartButton({
  styleId,
  variant = 'card',
  className,
  showLabel = false,
}: WishlistHeartButtonProps) {
  const isWishlisted = useWishlistStore((s) => s.items.includes(styleId));
  const toggle = useWishlistStore((s) => s.toggle);
  const [bumping, setBumping] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // Critical: prevent <Link> navigation when the heart is inside a card.
    e.preventDefault();
    e.stopPropagation();

    setBumping(true);
    void toggle(styleId).finally(() => {
      // Let the scale-bump finish; matches the duration-200 below.
      setTimeout(() => setBumping(false), 220);
    });
  };

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isWishlisted}
        aria-label={
          isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
        }
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-200',
          isWishlisted
            ? 'text-red-500 hover:bg-red-50'
            : 'text-slate-600 hover:bg-red-500 hover:text-white hover:scale-110',
          bumping && 'scale-125',
          className
        )}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            isWishlisted && 'fill-red-500'
          )}
        />
      </button>
    );
  }

  if (variant === 'pdp') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isWishlisted}
        aria-label={
          isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
        }
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-all duration-200',
          isWishlisted
            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-stone-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600',
          bumping && 'scale-110',
          className
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isWishlisted && 'fill-red-500 text-red-500'
          )}
        />
        {showLabel && (
          <span className="whitespace-nowrap">
            {isWishlisted ? 'Saved' : 'Save'}
          </span>
        )}
      </button>
    );
  }

  // variant === 'page'  → used on /wishlist tiles to remove items.
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isWishlisted}
      aria-label="Remove from wishlist"
      title="Remove from wishlist"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-md transition-all duration-200 hover:bg-red-50 hover:scale-105',
        bumping && 'scale-90',
        className
      )}
    >
      <Heart className="h-5 w-5 fill-red-500" />
    </button>
  );
}
