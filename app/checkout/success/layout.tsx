import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Order Confirmation | Garment Decor',
  description: 'Your order has been placed. Thank you for choosing Garment Decor.',
  path: '/checkout/success',
  noIndex: true,
});

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
