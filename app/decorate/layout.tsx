import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Screen Print Quote Builder | Garment Decor',
  description: 'Build your screen printing quote: choose garment, design complexity, colors, and get an instant estimate. Request a full quote from Garment Decor.',
  path: '/decorate',
});

export default function DecorateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
