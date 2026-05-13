import { Suspense } from 'react';
import { getOrderSession } from '@/lib/order-session';
import { VerificationForm } from '@/components/orders/VerificationForm';
import { InquiriesClient } from './InquiriesClient';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
  title: 'My Inquiries | My Orders',
  description: 'Every quote, contact form, and inquiry you have submitted.',
  robots: { index: false, follow: false },
};

export default async function InquiriesPage() {
  const session = await getOrderSession();

  if (!session) {
    return (
      <Suspense>
        <VerificationForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<InquiriesSkeleton />}>
      <InquiriesClient />
    </Suspense>
  );
}

function InquiriesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48 rounded" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
