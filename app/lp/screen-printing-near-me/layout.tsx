import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Screen Printing Near Me | Los Angeles & Southern California | Garment Decor',
  description: 'Local screen printing in Los Angeles, Orange County, Inland Empire & all of Southern California. Factory-direct pricing, same week turnaround, 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Screen Printing Near Me | Los Angeles & Southern California | Garment Decor',
    description: 'Local screen printing and embroidery company in Southern California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function ScreenPrintingNearMeLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
