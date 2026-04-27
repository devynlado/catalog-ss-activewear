import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom T-Shirt Printing in Southern California | Garment Decor',
  description: 'Factory-direct custom t-shirt printing in Los Angeles & Southern California. Same week turnaround, 50 piece minimum, premium screen printing. Get a free quote today.',
  openGraph: {
    title: 'Custom T-Shirt Printing in Southern California | Garment Decor',
    description: 'Factory-direct custom t-shirt printing in Los Angeles & Southern California. Same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function TShirtPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
