import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'About Us | Garment Decor',
  description: 'Learn about Garment Decor, a family-owned screen printing and embroidery company in Montclair, CA. Serving businesses since 2005 with quality custom apparel.',
  path: '/about',
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
