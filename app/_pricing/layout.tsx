import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Pricing Calculator | Garment Decor',
  description: 'Estimate pricing for screen printing, embroidery, digital and jumbo printing, and retail finishing. Get instant quotes with our pricing calculator.',
  path: '/pricing',
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
