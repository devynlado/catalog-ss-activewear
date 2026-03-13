import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/metadata';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

const url = `${getSiteUrl()}/services/screen-printing`;

export const metadata: Metadata = {
  title: 'Custom Screen Printing Services',
  description: 'Professional screen printing for t-shirts, hoodies, and apparel. Wholesale pricing, fast turnaround, and premium plastisol inks. Serving Los Angeles and Southern California.',
  keywords: ['screen printing', 'custom t-shirts', 'bulk printing', 'wholesale screen printing', 'Los Angeles screen printing'],
  alternates: { canonical: url },
  openGraph: {
    title: 'Custom Screen Printing Services | Garment Decor',
    description: 'Professional screen printing for t-shirts, hoodies, and apparel. Wholesale pricing and fast turnaround.',
    url,
    siteName: 'Garment Decor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Screen Printing Services | Garment Decor',
    description: 'Professional screen printing for t-shirts, hoodies, and apparel. Wholesale pricing and fast turnaround.',
  },
};

export default function ScreenPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Custom Screen Printing"
        description="Professional screen printing services for t-shirts, hoodies, and apparel. Wholesale pricing, fast turnaround, and premium plastisol inks."
        url={url}
      />
      {children}
    </>
  );
}
