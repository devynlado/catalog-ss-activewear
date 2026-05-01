import type { Metadata } from 'next';

// Force dynamic rendering to avoid useSearchParams issues during static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Silk Screen Printing in Southern California | Custom Silk Screen T-Shirts | Garment Decor',
  description: 'Local silk screen printing in Los Angeles & Southern California. Custom silk screen t-shirts, commercial silk screen printing, factory-direct pricing, same week turnaround. 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Silk Screen Printing in Southern California | Custom Silk Screen T-Shirts | Garment Decor',
    description: 'Local silk screen printing and custom silk screen t-shirts. Factory-direct pricing, same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function SilkScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
