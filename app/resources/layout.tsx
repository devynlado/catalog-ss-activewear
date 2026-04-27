import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/metadata';

const description = 'Free guides and resources for screen printing and embroidery. Learn about artwork preparation, file formats, color matching, and best practices.';
const url = `${getSiteUrl()}/resources`;

export const metadata: Metadata = {
  title: {
    template: '%s | Resources | Garment Decor',
    default: 'Resources & Guides | Garment Decor',
  },
  description,
  alternates: { canonical: url },
  openGraph: {
    title: 'Resources & Guides | Garment Decor',
    description,
    url,
    siteName: 'Garment Decor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resources & Guides | Garment Decor',
    description,
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
