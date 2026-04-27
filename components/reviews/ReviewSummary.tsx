'use client';

import { StarRating } from './StarRating';

interface ReviewSummaryProps {
  avgRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export function ReviewSummary({ avgRating, reviewCount, distribution }: ReviewSummaryProps) {
  if (reviewCount === 0) return null;

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
      {/* Overall rating */}
      <div className="flex flex-col items-center text-center shrink-0">
        <span className="text-4xl font-bold text-navy-800">{avgRating.toFixed(1)}</span>
        <StarRating rating={avgRating} size="md" className="mt-1" />
        <span className="mt-1.5 text-sm text-slate-500">
          {reviewCount} review{reviewCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Star distribution */}
      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2.5">
              <span className="w-6 text-right text-xs font-medium text-slate-500">{star}</span>
              <StarRating rating={star} maxStars={1} size="sm" />
              <div className="flex-1 h-2.5 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
