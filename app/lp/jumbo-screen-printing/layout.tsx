import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Jumbo & Oversized Screen Printing | Custom Large Format Prints | Garment Decor',
  description: 'Custom jumbo and oversized screen printing in Southern California. Prints up to 18"x23" on tees, hoodies, and long sleeves. Factory-direct pricing, 50 piece minimum. Get a free quote today.',
  openGraph: {
    title: 'Jumbo & Oversized Screen Printing | Custom Large Format Prints | Garment Decor',
    description: 'Custom jumbo and oversized screen printing in Southern California. Prints up to 18"x23". Factory-direct pricing, 50 piece minimum.',
    type: 'website',
  },
};

export default function JumboScreenPrintingLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
