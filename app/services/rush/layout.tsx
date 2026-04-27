import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Rush Screen Printing - Fast Turnaround',
  description: 'Rush screen printing and embroidery services as fast as 48 hours. Emergency orders, last-minute events, and tight deadlines. Southern California rush printing.',
  keywords: ['rush printing', 'fast turnaround', 'same day printing', 'emergency printing', 'quick screen printing'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/rush',
  },
  openGraph: {
    title: 'Rush Screen Printing - Fast Turnaround | Garment Decor',
    description: 'Rush screen printing services as fast as 48 hours. Emergency orders and tight deadlines.',
    url: 'https://garmentdecor.com/services/rush',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function RushLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Rush Printing Services"
        description="Rush screen printing and embroidery services as fast as 48 hours. Emergency orders, last-minute events, and tight deadlines."
        url="https://garmentdecor.com/services/rush"
      />
      {children}
    </>
  );
}
