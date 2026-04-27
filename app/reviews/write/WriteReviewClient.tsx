'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Gift, CheckCircle2, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import type { ReviewProduct } from './page';

interface WriteReviewClientProps {
  token: string;
  products: ReviewProduct[];
  customerName: string | null;
  orderNumber: string;
}

type ViewState = 'form' | 'success';

export function WriteReviewClient({ token, products, customerName, orderNumber }: WriteReviewClientProps) {
  const [view, setView] = useState<ViewState>('form');
  const [selectedProduct, setSelectedProduct] = useState<ReviewProduct>(products[0]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  const firstName = customerName?.split(/\s+/)[0] || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    if (body.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          styleId: selectedProduct.styleId,
          orderId: selectedProduct.orderId,
          rating,
          title: title.trim() || undefined,
          reviewBody: body.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review');
        return;
      }

      setCouponCode(data.couponCode || null);
      setReviewStatus(data.message || null);
      setView('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 border border-green-200">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy-800 mb-2">Thank You{firstName ? `, ${firstName}` : ''}!</h1>
          <p className="text-slate-500 mb-6">{reviewStatus || 'Your review has been submitted successfully.'}</p>

          {couponCode && (
            <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-brand-600" />
                <p className="text-sm font-semibold text-brand-700">Your 10% Off Reward</p>
              </div>
              <p className="text-3xl font-bold text-navy-800 tracking-wider font-mono mb-2">{couponCode}</p>
              <p className="text-xs text-slate-500">Use this code at checkout. Valid for 90 days, single use.</p>
            </div>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="https://cdn.sanity.io/images/sgko7666/production/0c91639c2cfb4be5a8fc544a6a8b5fed94d2ff5c-2560x600.png"
              alt="Garment Decor"
              width={160}
              height={38}
              className="h-8 w-auto"
              unoptimized
            />
          </Link>
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            {firstName ? `Hi ${firstName}, how was your order?` : 'How was your order?'}
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Order <span className="font-medium text-slate-700">{orderNumber}</span>
          </p>
        </div>

        {/* Product selector (if multiple products) */}
        {products.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select a product to review</label>
            <div className="space-y-2">
              {products.map(p => (
                <button
                  key={p.styleId}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    selectedProduct.styleId === p.styleId
                      ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {p.imageUrl && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-800 truncate">{p.brandName} {p.styleName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.colorName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review form card */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-300/30 overflow-hidden">
          {/* Product header */}
          <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50/50 px-6 py-4">
            {selectedProduct.imageUrl && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                <Image src={selectedProduct.imageUrl} alt={selectedProduct.title} fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-800">{selectedProduct.brandName} {selectedProduct.styleName}</p>
              <p className="text-xs text-slate-500 truncate">{selectedProduct.title}</p>
              {selectedProduct.colorName && (
                <p className="text-xs text-slate-400">Color: {selectedProduct.colorName}</p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Star rating */}
            <div className="text-center">
              <label className="text-sm font-medium text-navy-800">Tap to rate</label>
              <StarRating rating={rating} size="lg" interactive onChange={setRating} className="mt-3 justify-center" />
              <p className="mt-1 text-xs text-slate-400">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : '\u00A0'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-navy-800">
                Review Title <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
                className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium text-navy-800">Your Review</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="What did you like or dislike? How was the quality?"
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">{body.length}/10 minimum characters</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Incentive banner */}
            <div className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-200 p-3">
              <Gift className="h-5 w-5 text-brand-600 shrink-0" />
              <p className="text-xs text-brand-700">
                <span className="font-semibold">Get 10% off</span> your next order after submitting your review!
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Review
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your review helps us improve and helps other customers choose wisely.
        </p>
      </div>
    </div>
  );
}
