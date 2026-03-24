import { Suspense } from 'react';
import { getOrderSession } from '@/lib/order-session';
import { VerificationForm } from '@/components/orders/VerificationForm';
import { ReviewsDashboardClient } from './ReviewsDashboardClient';
import { Skeleton } from '@/components/ui/Skeleton';

export default async function ReviewsPage() {
  const session = await getOrderSession();

  if (!session) {
    return (
      <Suspense>
        <VerificationForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ReviewsSkeleton />}>
      <ReviewsDashboardClient />
    </Suspense>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
