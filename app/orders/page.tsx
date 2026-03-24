import { Suspense } from 'react';
import { getOrderSession } from '@/lib/order-session';
import { VerificationForm } from '@/components/orders/VerificationForm';
import { OrderListClient } from './OrderListClient';
import { Skeleton } from '@/components/ui/Skeleton';

export default async function OrdersPage() {
  const session = await getOrderSession();

  if (!session) {
    return (
      <Suspense>
        <VerificationForm />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <OrderListClient />
    </Suspense>
  );
}

function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
