import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Jumbo Screen Printing - Oversized Prints',
  description: 'Large format jumbo screen printing up to 17x23 inches. All-over prints, oversized graphics, and full-chest designs. Wholesale pricing in Southern California.',
  keywords: ['jumbo printing', 'oversized prints', 'all-over printing', 'large format screen printing', 'big prints'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/jumbo-screen-printing',
  },
  openGraph: {
    title: 'Jumbo Screen Printing | Garment Decor',
    description: 'Large format jumbo screen printing up to 17x23 inches. All-over prints and oversized graphics.',
    url: 'https://garmentdecor.com/services/jumbo-screen-printing',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function JumboPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Jumbo Screen Printing"
        description="Large format jumbo screen printing up to 17x23 inches. All-over prints, oversized graphics, and full-chest designs."
        url="https://garmentdecor.com/services/jumbo-screen-printing"
      />
      {children}
    </>
  );
}
