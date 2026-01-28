import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Puff Screen Printing - 3D Raised Ink',
  description: '3D puff screen printing with raised, textured ink effects. Add dimension to your designs with premium puff additives. Wholesale pricing in Southern California.',
  keywords: ['puff printing', '3D printing', 'raised ink', 'textured screen printing', 'puff ink'],
  alternates: {
    canonical: 'https://garmentdecor.com/services/puff-screen-printing',
  },
  openGraph: {
    title: 'Puff Screen Printing - 3D Raised Ink | Garment Decor',
    description: '3D puff screen printing with raised, textured ink effects. Add dimension to your designs.',
    url: 'https://garmentdecor.com/services/puff-screen-printing',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function PuffPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Puff Screen Printing"
        description="3D puff screen printing with raised, textured ink effects. Add dimension to your designs with premium puff additives."
        url="https://garmentdecor.com/services/puff-screen-printing"
      />
      {children}
    </>
  );
}
