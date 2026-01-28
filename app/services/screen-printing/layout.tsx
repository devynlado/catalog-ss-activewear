import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Custom Screen Printing Services',
  description: 'Professional screen printing for t-shirts, hoodies, and apparel. Wholesale pricing, fast turnaround, and premium plastisol inks. Serving Los Angeles and Southern California.',
  keywords: ['screen printing', 'custom t-shirts', 'bulk printing', 'wholesale screen printing', 'Los Angeles screen printing'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/screen-printing',
  },
  openGraph: {
    title: 'Custom Screen Printing Services | Garment Decor',
    description: 'Professional screen printing for t-shirts, hoodies, and apparel. Wholesale pricing and fast turnaround.',
    url: 'https://garmentdecor.com/services/screen-printing',
    siteName: 'Garment Decor',
    type: 'website',
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
        url="https://garmentdecor.com/services/screen-printing"
      />
      {children}
    </>
  );
}
