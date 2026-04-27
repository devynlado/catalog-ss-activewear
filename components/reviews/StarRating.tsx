'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizeClass = SIZE_MAP[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.floor(rating);
        const halfFilled = !filled && starValue <= Math.ceil(rating) && rating % 1 >= 0.25;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={interactive ? undefined : undefined}
            className={cn(
              'relative transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            aria-label={interactive ? `Rate ${starValue} stars` : undefined}
          >
            <Star
              className={cn(
                sizeClass,
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                    ? 'fill-amber-400/50 text-amber-400'
                    : interactive
                      ? 'fill-stone-200 text-stone-300 hover:fill-amber-200 hover:text-amber-300'
                      : 'fill-stone-200 text-stone-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
