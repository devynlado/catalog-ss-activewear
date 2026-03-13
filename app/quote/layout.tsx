import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Request a Quote | Garment Decor',
  description: 'Request a custom quote for screen printing, embroidery, or apparel. Add products, decoration options, and get pricing from Garment Decor.',
  path: '/quote',
});

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
