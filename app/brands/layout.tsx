import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Brands We Carry | Garment Decor',
  description: 'Browse blank apparel brands available at Garment Decor: Gildan, Bella+Canvas, Comfort Colors, Next Level, and more. Wholesale for screen printing and embroidery.',
  path: '/brands',
});

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
