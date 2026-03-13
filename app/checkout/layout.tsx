import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Checkout | Garment Decor',
  description: 'Complete your custom apparel order. Secure checkout for screen printing and embroidery.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
