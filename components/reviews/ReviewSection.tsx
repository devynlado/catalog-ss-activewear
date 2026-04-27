'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { ReviewSummary } from './ReviewSummary';
import { ReviewCard } from './ReviewCard';
import { cn } from '@/lib/utils';

interface ReviewData {
  id: string;
  customerName: string | null;
  rating: number;
  title: string | null;
  body: string;
  reviewerAvatar: string | null;
  verifiedPurchase: boolean;
  adminResponse: string | null;
  createdAt: string;
}

interface ReviewSectionProps {
  styleId: number;
  productName: string;
}

type SortOption = 'newest' | 'highest' | 'lowest';

export function ReviewSection({ styleId, productName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [aggregate, setAggregate] = useState<{
    avgRating: number;
    reviewCount: number;
    distribution: Record<number, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, sortBy: SortOption, append = false) => {
    if (pageNum === 1 && !append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/reviews?styleId=${styleId}&page=${pageNum}&sort=${sortBy}`);
      const data = await res.json();

      if (append) {
        setReviews(prev => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }
      setAggregate(data.aggregate);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [styleId]);

  useEffect(() => {
    fetchReviews(1, sort);
    setPage(1);
  }, [sort, fetchReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, sort, true);
  };

  if (loading) {
    return (
      <div id="reviews" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
        <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!aggregate || aggregate.reviewCount === 0) {
    return null;
  }

  return (
    <div id="reviews" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-800">Customer Reviews</h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <ReviewSummary
        avgRating={aggregate.avgRating}
        reviewCount={aggregate.reviewCount}
        distribution={aggregate.distribution}
      />

      <div className="divide-y divide-stone-100">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {page < totalPages && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-stone-50 transition-colors',
              loadingMore && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loadingMore ? (
              'Loading...'
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More Reviews
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
