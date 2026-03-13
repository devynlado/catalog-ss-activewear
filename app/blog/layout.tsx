import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Blog | Garment Decor',
  description: 'Tips, guides, and industry insights on screen printing, embroidery, custom apparel, and growing your brand with decorated garments.',
  path: '/blog',
});

export const revalidate = 60;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
