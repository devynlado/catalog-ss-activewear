import { Suspense } from 'react';
import { getOrderSession } from '@/lib/order-session';
import { VerificationForm } from '@/components/orders/VerificationForm';
import { GuidesClient } from './GuidesClient';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
  title: 'Free Guides | My Orders',
  description: 'Get our free screen printing and embroidery prep guides delivered to your inbox.',
  robots: { index: false, follow: false },
};

export default async function GuidesPage() {
  const session = await getOrderSession();

  if (!session) {
    return (
      <Suspense>
        <VerificationForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <GuidesClient email={session.email} />
    </Suspense>
  );
}
