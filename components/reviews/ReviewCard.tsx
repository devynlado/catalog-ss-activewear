'use client';

import Image from 'next/image';
import { CheckCircle2, MessageSquare, User } from 'lucide-react';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: {
    id: string;
    customerName: string | null;
    rating: number;
    title: string | null;
    body: string;
    reviewerAvatar: string | null;
    verifiedPurchase: boolean;
    adminResponse: string | null;
    createdAt: string;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDisplayName(name: string | null): string {
  if (!name) return 'Customer';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return parts[0];
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-stone-100 py-6 last:border-0">
      <div className="flex items-start gap-3">
        {/* Reviewer avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100 border border-stone-200">
          {review.reviewerAvatar ? (
            <Image
              src={review.reviewerAvatar}
              alt={getDisplayName(review.customerName)}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
              {review.customerName ? getInitials(review.customerName) : <User className="h-4 w-4 text-slate-400" />}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} size="sm" />
            {review.title && (
              <h4 className="text-sm font-semibold text-navy-800">{review.title}</h4>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{getDisplayName(review.customerName)}</span>
            <span>&middot;</span>
            <span>{formatDate(review.createdAt)}</span>
            {review.verifiedPurchase && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Purchase
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 ml-13 text-sm leading-relaxed text-slate-600">{review.body}</p>

      {review.adminResponse && (
        <div className="mt-4 ml-13 rounded-lg bg-brand-50 border border-brand-100 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand-700 mb-1">
            <MessageSquare className="h-3 w-3" />
            Response from Garment Decor
          </div>
          <p className="text-sm text-slate-600">{review.adminResponse}</p>
        </div>
      )}
    </div>
  );
}
