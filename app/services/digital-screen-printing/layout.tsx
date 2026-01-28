import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Digital Screen Printing (DTG) Services',
  description: 'Full-color digital screen printing for photo-quality prints. Unlimited colors, no setup fees, ideal for small batches and complex designs. Southern California.',
  keywords: ['digital printing', 'DTG printing', 'full color printing', 'photo printing shirts', 'direct to garment'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/digital-screen-printing',
  },
  openGraph: {
    title: 'Digital Screen Printing Services | Garment Decor',
    description: 'Full-color digital printing for photo-quality results. Unlimited colors, no setup fees, ideal for complex designs.',
    url: 'https://garmentdecor.com/services/digital-screen-printing',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function DigitalPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Digital Screen Printing"
        description="Full-color digital screen printing for photo-quality prints. Unlimited colors, no setup fees, ideal for small batches and complex designs."
        url="https://garmentdecor.com/services/digital-screen-printing"
      />
      {children}
    </>
  );
}
