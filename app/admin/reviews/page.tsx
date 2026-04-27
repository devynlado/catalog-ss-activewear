import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { AdminReviewsClient } from './AdminReviewsClient';

export const metadata = {
  title: 'Review Moderation',
  description: 'Manage and moderate customer product reviews',
};

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="h-5 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold text-navy-800">Review Moderation</h1>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-stone-100" />}>
        <AdminReviewsClient />
      </Suspense>
    </div>
  );
}
