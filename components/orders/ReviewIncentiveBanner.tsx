'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, X, ArrowRight, Star } from 'lucide-react';

// Snooze duration after a dismiss. The banner re-appears after this window even
// without new eligible reviews — by then the user may also have new orders.
const SNOOZE_DAYS = 14;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'orders.reviewBannerSnoozedUntil';

interface ReviewIncentiveBannerProps {
  email: string;
}

export function ReviewIncentiveBanner({ email }: ReviewIncentiveBannerProps) {
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Keyed by email so dismissals don't leak between accounts on shared devices.
  const storageKey = `${STORAGE_KEY}:${email.toLowerCase()}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const until = parseInt(raw, 10);
      if (!Number.isNaN(until) && until > Date.now()) {
        setDismissed(true);
        return;
      }
    }

    let cancelled = false;
    fetch('/api/orders/reviews')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { eligible?: unknown[] }) => {
        if (cancelled) return;
        setEligibleCount(Array.isArray(data.eligible) ? data.eligible.length : 0);
      })
      .catch(() => {
        if (cancelled) return;
        setEligibleCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, String(Date.now() + SNOOZE_MS));
    }
  };

  if (dismissed) return null;
  if (eligibleCount === null) return null; // still loading — render nothing instead of CLS
  if (eligibleCount === 0) return null;

  const plural = eligibleCount === 1 ? 'product' : 'products';

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 sm:h-12 sm:w-12">
          <Gift className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-amber-900 sm:text-base">
            <span>Get 10% OFF your next order</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {eligibleCount} {plural} ready
            </span>
          </p>
          <p className="mt-1 text-xs text-amber-800/80 sm:text-sm">
            Share your experience with the {plural} you received. Each approved review earns a 10% OFF coupon — use one per future order. Takes about a minute.
          </p>

          <div className="mt-3">
            <Link
              href="/orders/reviews"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 sm:text-sm"
            >
              Review now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          title={`Hide for ${SNOOZE_DAYS} days`}
          className="rounded-md p-1 text-amber-700/60 hover:bg-amber-100 hover:text-amber-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
