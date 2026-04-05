import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Puff Screen Printing | 3D Raised Ink Prints | Garment Decor',
  description: 'Custom puff screen printing in Southern California. Raised 3D texture, premium hand feel, durable finish. Perfect for streetwear and fashion brands. 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Puff Screen Printing | 3D Raised Ink Prints | Garment Decor',
    description: 'Custom puff screen printing — raised 3D texture, premium hand feel, durable finish. Factory-direct pricing, 50 piece minimum.',
    type: 'website',
  },
};

export default function PuffScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
