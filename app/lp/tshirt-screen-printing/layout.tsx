import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'T-Shirt Screen Printing | Custom Screen Prints | Garment Decor',
  description: 'Order custom screen printing t-shirts from our Southern California factory. High quality prints that last, same week turnaround, 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'T-Shirt Screen Printing | Custom Screen Prints | Garment Decor',
    description: 'Order custom screen printing t-shirts from our Southern California factory. High quality prints, same week turnaround, 50 piece minimum.',
    type: 'website',
  },
};

export default function TshirtScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
