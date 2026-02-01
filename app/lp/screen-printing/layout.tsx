import type { Metadata } from 'next';

// Force dynamic rendering to avoid useSearchParams issues during static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Screen Printing in Southern California | Garment Decor',
  description: 'Factory-direct screen printing in Los Angeles & Southern California. Same week turnaround, 50 piece minimum, premium quality. Get a free quote today.',
  openGraph: {
    title: 'Screen Printing in Southern California | Garment Decor',
    description: 'Factory-direct screen printing in Los Angeles & Southern California. Same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function ScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
