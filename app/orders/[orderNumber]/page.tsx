import { redirect } from 'next/navigation';
import { getOrderSession } from '@/lib/order-session';
import { OrderDetailClient } from './OrderDetailClient';

interface OrderDetailPageProps {
  params: { orderNumber: string };
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
  return {
    title: `Order ${params.orderNumber} | Garment Decor`,
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getOrderSession();

  if (!session) {
    redirect(`/orders?token=&redirect=${params.orderNumber}`);
  }

  return <OrderDetailClient orderNumber={params.orderNumber} />;
}
