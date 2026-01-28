import { Metadata } from 'next';
import { ArticleJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Embroidery Guide - Logo Digitizing Tips',
  description: 'Complete guide to preparing logos for embroidery. Learn about digitizing, stitch counts, thread colors, and best practices for embroidered apparel.',
  keywords: ['embroidery guide', 'logo digitizing', 'embroidery tips', 'stitch count', 'embroidered logos'],
  alternates: {
    canonical: 'https://garmentdecor.com/resources/embroidery-guide',
  },
  openGraph: {
    title: 'Embroidery Guide - Logo Digitizing Tips | Garment Decor',
    description: 'Complete guide to preparing logos for embroidery. Digitizing tips and best practices.',
    url: 'https://garmentdecor.com/resources/embroidery-guide',
    siteName: 'Garment Decor',
    type: 'article',
  },
};

export default function EmbroideryGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ArticleJsonLd
        title="Embroidery Guide - Logo Digitizing Tips"
        description="Complete guide to preparing logos for embroidery. Learn about digitizing, stitch counts, thread colors, and best practices."
        url="https://garmentdecor.com/resources/embroidery-guide"
      />
      {children}
    </>
  );
}
