import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Simulated Process Printing',
  description: 'Simulated process screen printing for photorealistic designs on dark garments. Complex color blends and gradients with limited spot colors.',
  keywords: ['simulated process', 'photorealistic printing', 'process printing', 'color separation', 'dark garment printing'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/simulated-process',
  },
  openGraph: {
    title: 'Simulated Process Printing | Garment Decor',
    description: 'Simulated process screen printing for photorealistic designs on dark garments.',
    url: 'https://garmentdecor.com/services/simulated-process',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function SimulatedProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Simulated Process Printing"
        description="Simulated process screen printing for photorealistic designs on dark garments. Complex color blends and gradients with limited spot colors."
        url="https://garmentdecor.com/services/simulated-process"
      />
      {children}
    </>
  );
}
