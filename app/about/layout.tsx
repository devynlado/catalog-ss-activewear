import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Our Story',
  description: 'Learn about Garment Decor, a family-owned screen printing and embroidery company in Montclair, CA. Serving businesses since 2005 with quality custom apparel.',
  keywords: ['about Garment Decor', 'screen printing company', 'Montclair CA', 'custom apparel company', 'family business'],
  alternates: {
    canonical: 'https://garmentdecor.com/about',
  },
  openGraph: {
    title: 'About Garment Decor | Custom Screen Printing & Embroidery',
    description: 'Family-owned screen printing and embroidery company in Montclair, CA. Serving businesses since 2005.',
    url: 'https://garmentdecor.com/about',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
