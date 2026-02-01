import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Embroidery in Southern California | Garment Decor',
  description: 'Professional custom embroidery in Los Angeles & Southern California. Premium threads, expert digitizing, factory-direct pricing. Get a free quote today.',
  openGraph: {
    title: 'Custom Embroidery in Southern California | Garment Decor',
    description: 'Professional custom embroidery in Los Angeles & Southern California. Premium threads, expert digitizing.',
    type: 'website',
  },
};

export default function EmbroideryLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
