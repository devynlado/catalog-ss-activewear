import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Large & Enterprise Orders | 500+ Pieces',
  description: 'Dedicated support for large orders of 500+ pieces. Volume pricing, dedicated account rep, custom timelines, and multi-location shipping. Contact us for enterprise-level service.',
  keywords: ['bulk apparel orders', 'enterprise custom apparel', 'wholesale decorated apparel', 'large volume printing', 'corporate apparel program'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/large-orders',
  },
  openGraph: {
    title: 'Large & Enterprise Orders | Garment Decor',
    description: 'Dedicated support for large orders of 500+ pieces. Volume pricing and enterprise-level service.',
    url: 'https://garmentdecor.com/services/large-orders',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function LargeOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Large & Enterprise Orders"
        description="Dedicated support for large orders of 500+ pieces. Volume pricing, dedicated account rep, custom timelines, and multi-location shipping."
        url="https://garmentdecor.com/services/large-orders"
      />
      {children}
    </>
  );
}
