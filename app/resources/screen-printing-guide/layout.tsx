import { Metadata } from 'next';
import { ArticleJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Screen Printing Guide - Artwork Preparation',
  description: 'Complete guide to preparing artwork for screen printing. Learn about file formats, color separations, sizing, and common mistakes to avoid.',
  keywords: ['screen printing guide', 'artwork preparation', 'print-ready files', 'color separations', 'screen printing tips'],
  alternates: {
    canonical: 'https://garmentdecor.com/resources/screen-printing-guide',
  },
  openGraph: {
    title: 'Screen Printing Guide - Artwork Preparation | Garment Decor',
    description: 'Complete guide to preparing artwork for screen printing. File formats, color separations, and tips.',
    url: 'https://garmentdecor.com/resources/screen-printing-guide',
    siteName: 'Garment Decor',
    type: 'article',
  },
};

export default function ScreenPrintingGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ArticleJsonLd
        title="Screen Printing Guide - Artwork Preparation"
        description="Complete guide to preparing artwork for screen printing. Learn about file formats, color separations, sizing, and common mistakes to avoid."
        url="https://garmentdecor.com/resources/screen-printing-guide"
      />
      {children}
    </>
  );
}
