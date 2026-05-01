import type { Metadata } from 'next';

// Force dynamic rendering to avoid useSearchParams issues during static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom T-Shirt Printing in Southern California | Wholesale & Bulk Shirt Printing | Garment Decor',
  description: 'Local custom t-shirt printing in Los Angeles & Southern California. Wholesale shirt printing, bulk t-shirt printing, factory-direct pricing, same week turnaround, 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Custom T-Shirt Printing in Southern California | Wholesale & Bulk Shirt Printing | Garment Decor',
    description: 'Local custom t-shirt printing, wholesale shirt printing, and bulk t-shirt printing. Factory-direct pricing, same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function CustomTShirtPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
