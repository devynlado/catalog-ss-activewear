import { Suspense } from 'react';
import { getOrderSession } from '@/lib/order-session';
import { VerificationForm } from '@/components/orders/VerificationForm';
import { RequestQuoteClient } from './RequestQuoteClient';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
  title: 'Request Quote | My Orders',
  description: 'Get a price for a new project — your contact details are already filled in.',
  robots: { index: false, follow: false },
};

export default async function RequestQuotePage() {
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
      <RequestQuoteClient
        email={session.email}
        name={session.customer.name}
        phone={session.customer.phone}
        company={session.customer.company}
      />
    </Suspense>
  );
}
