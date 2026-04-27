import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Retail Finishing & Private Label Services',
  description: 'Professional retail finishing services including hang tags, sewn labels, folding, bagging, and custom packaging. Launch your clothing brand with Garment Decor.',
  keywords: ['retail finishing', 'private label', 'hang tags', 'sewn labels', 'custom packaging', 'clothing brand'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/retail-finishing',
  },
  openGraph: {
    title: 'Retail Finishing & Private Label | Garment Decor',
    description: 'Professional retail finishing: hang tags, sewn labels, folding, bagging, and custom packaging.',
    url: 'https://garmentdecor.com/services/retail-finishing',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function RetailFinishingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Retail Finishing Services"
        description="Professional retail finishing services including hang tags, sewn labels, folding, bagging, and custom packaging for clothing brands."
        url="https://garmentdecor.com/services/retail-finishing"
      />
      {children}
    </>
  );
}
