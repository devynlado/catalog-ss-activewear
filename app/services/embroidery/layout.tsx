import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Custom Embroidery Services',
  description: 'Premium custom embroidery for logos, corporate apparel, and uniforms. Professional digitizing, wholesale pricing, and fast turnaround in Southern California.',
  keywords: ['custom embroidery', 'logo embroidery', 'corporate embroidery', 'embroidered apparel', 'wholesale embroidery'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/embroidery',
  },
  openGraph: {
    title: 'Custom Embroidery Services | Garment Decor',
    description: 'Premium custom embroidery for logos, corporate apparel, and uniforms. Professional digitizing and wholesale pricing.',
    url: 'https://garmentdecor.com/services/embroidery',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function EmbroideryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Custom Embroidery"
        description="Premium custom embroidery for logos, corporate apparel, and uniforms. Professional digitizing, wholesale pricing, and fast turnaround."
        url="https://garmentdecor.com/services/embroidery"
      />
      {children}
    </>
  );
}
