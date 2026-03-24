'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CheckCircle2, XCircle, Clock, MessageSquare, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { cn } from '@/lib/utils';

interface ReviewItem {
  id: string;
  style_id: number;
  customer_email: string;
  customer_name: string | null;
  rating: number;
  title: string | null;
  body: string;
  reviewerAvatar: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_response: string | null;
  created_at: string;
  product: {
    style_name: string;
    brand_name: string;
    primary_image_url: string | null;
  } | null;
}

const TABS = [
  { key: 'pending', label: 'Pending', Icon: Clock },
  { key: 'approved', label: 'Approved', Icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', Icon: XCircle },
  { key: 'all', label: 'All', Icon: MessageSquare },
] as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${activeTab}&page=${page}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (reviewId: string, action: 'approved' | 'rejected', adminResponse?: string) => {
    setActionLoading(reviewId);
    try {
      const body: Record<string, string> = { status: action };
      if (adminResponse?.trim()) body.adminResponse = adminResponse.trim();

      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchReviews();
        setExpandedResponse(null);
      }
    } catch {
      console.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === key
                ? 'bg-white text-navy-800 shadow-sm'
                : 'text-slate-500 hover:text-navy-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">{total} review{total !== 1 ? 's' : ''} found</p>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-stone-200 bg-white">
          <p className="text-sm text-slate-500">No {activeTab !== 'all' ? activeTab : ''} reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Product image */}
                {review.product?.primary_image_url && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-100">
                    <Image src={review.product.primary_image_url} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-navy-800">
                        {review.product ? `${review.product.brand_name} ${review.product.style_name}` : `Style #${review.style_id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-slate-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      review.status === 'approved' && 'bg-green-50 text-green-700 border-green-200',
                      review.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                      review.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                    )}>
                      {review.status}
                    </span>
                  </div>

                  {/* Customer info */}
                  <p className="text-xs text-slate-400 mt-1">
                    {review.customer_name || 'Anonymous'} &middot; {review.customer_email}
                  </p>

                  {/* Review content */}
                  {review.title && (
                    <p className="text-sm font-medium text-slate-700 mt-2">{review.title}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-1">{review.body}</p>

                  {/* Reviewer avatar */}
                  {review.reviewerAvatar && (
                    <div className="mt-2">
                      <a href={review.reviewerAvatar} target="_blank" rel="noopener noreferrer">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-stone-200 hover:border-brand-400 transition-colors">
                          <Image src={review.reviewerAvatar} alt="Reviewer" fill className="object-cover" unoptimized />
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Existing admin response */}
                  {review.admin_response && (
                    <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-2.5">
                      <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide mb-1">Your Response</p>
                      <p className="text-xs text-slate-600">{review.admin_response}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {review.status === 'pending' && (
                    <div className="mt-4 space-y-3">
                      {/* Response input (toggleable) */}
                      {expandedResponse === review.id ? (
                        <div>
                          <textarea
                            value={responseText[review.id] || ''}
                            onChange={(e) => setResponseText(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Optional response to the customer..."
                            rows={2}
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedResponse(review.id)}
                          className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
                        >
                          + Add response (optional)
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(review.id, 'approved', responseText[review.id])}
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === review.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(review.id, 'rejected', responseText[review.id])}
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === review.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
