import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Contact Us | Garment Decor',
  description: 'Get in touch with Garment Decor for custom screen printing and embroidery quotes. Call (855) 942-7636 or request a quote online. Montclair, CA.',
  path: '/contact',
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
