import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom Embroidery Services | Hats, Shirts, Jackets & More | Garment Decor',
  description: 'Order custom embroidery for hats, polo shirts, hoodies, jackets, bags, and patches. Serving Los Angeles, Orange County, San Diego & all of California. Free digitizing, factory-direct pricing.',
  openGraph: {
    title: 'Custom Embroidery Services | Hats, Shirts, Jackets & More | Garment Decor',
    description: 'Custom embroidery for hats, shirts, hoodies, jackets, and patches. Factory-direct pricing, free digitizing, fast turnaround.',
    type: 'website',
  },
};

export default function CustomEmbroideryLPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
