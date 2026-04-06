import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Digital Screen Printing | Full Color Custom Prints | Garment Decor',
  description: 'Custom digital screen printing in Southern California. Unlimited colors, photo-realistic prints, soft water-based feel. 400 garments/hour, 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Digital Screen Printing | Full Color Custom Prints | Garment Decor',
    description: 'Custom digital screen printing — unlimited colors, photo-realistic detail, soft hand feel. Factory-direct pricing, 50 piece minimum.',
    type: 'website',
  },
};

export default function DigitalScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
