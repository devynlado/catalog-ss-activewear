import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Cart | Garment Decor',
  description: 'Review your custom apparel and decoration quote. Add items, request a quote, or proceed to checkout.',
  path: '/cart',
});

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
