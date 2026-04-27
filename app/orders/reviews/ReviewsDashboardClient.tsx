'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Gift, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewForm } from '@/components/orders/ReviewForm';
import { cn } from '@/lib/utils';

interface EligibleProduct {
  styleId: number;
  styleName: string;
  brandName: string;
  title: string;
  colorName: string;
  imageUrl: string;
  orderId: string;
  orderNumber: string;
  deliveredAt: string;
}

interface PastReview {
  id: string;
  styleId: number;
  rating: number;
  title: string | null;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  couponCode: string | null;
  adminResponse: string | null;
  createdAt: string;
  productName: string;
  productImage: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_BADGE: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: 'Published', className: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  pending: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  rejected: { label: 'Not Published', className: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
};

export function ReviewsDashboardClient() {
  const [eligible, setEligible] = useState<EligibleProduct[]>([]);
  const [pastReviews, setPastReviews] = useState<PastReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingProduct, setReviewingProduct] = useState<EligibleProduct | null>(null);
  const [successCoupon, setSuccessCoupon] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/orders/reviews');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEligible(data.eligible);
      setPastReviews(data.pastReviews);
    } catch {
      console.error('Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReviewSubmitted = (couponCode: string | null) => {
    setReviewingProduct(null);
    setSuccessCoupon(couponCode);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
        {[1, 2].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {successCoupon && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <Gift className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Thank you for your review!</p>
            <p className="text-sm text-green-700 mt-1">
              Here&apos;s your reward code: <strong className="font-mono text-base">{successCoupon}</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">Use it at checkout for 10% off your next order. Valid for 90 days.</p>
          </div>
          <button onClick={() => setSuccessCoupon(null)} className="ml-auto text-green-400 hover:text-green-600">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Products eligible for review */}
      {eligible.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Products to Review
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {eligible.length}
            </span>
          </h2>
          <div className="space-y-3">
            {eligible.map((product) => (
              <div
                key={`${product.styleId}-${product.orderId}`}
                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                {product.imageUrl && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-100">
                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-800 truncate">
                    {product.brandName} {product.styleName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{product.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Order {product.orderNumber} &middot; Delivered {formatDate(product.deliveredAt)}
                  </p>
                </div>
                <button
                  onClick={() => setReviewingProduct(product)}
                  className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            Get a 10% off coupon for each review you submit!
          </p>
        </section>
      )}

      {/* Past reviews */}
      <section>
        <h2 className="text-lg font-bold text-navy-800 mb-4">Your Reviews</h2>
        {pastReviews.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-stone-200 bg-white">
            <Star className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm text-slate-500">You haven&apos;t written any reviews yet.</p>
            {eligible.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">Select a product above to get started!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pastReviews.map((review) => {
              const badge = STATUS_BADGE[review.status];
              const BadgeIcon = badge.Icon;
              return (
                <div key={review.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {review.productImage && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-100">
                        <Image src={review.productImage} alt={review.productName} fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-navy-800 truncate">{review.productName}</p>
                        <span className={cn(
                          'shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          badge.className
                        )}>
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.title && (
                        <p className="text-sm font-medium text-slate-700 mt-2">{review.title}</p>
                      )}
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{review.body}</p>

                      {review.adminResponse && (
                        <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-2.5">
                          <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide mb-1">Garment Decor Response</p>
                          <p className="text-xs text-slate-600">{review.adminResponse}</p>
                        </div>
                      )}

                      {review.couponCode && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                          <Gift className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-green-700">
                            Reward code: <strong className="font-mono">{review.couponCode}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review form modal */}
      {reviewingProduct && (
        <ReviewForm
          product={reviewingProduct}
          onClose={() => setReviewingProduct(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
