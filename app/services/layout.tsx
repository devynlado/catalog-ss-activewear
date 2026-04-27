import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/metadata';

const description = 'Professional screen printing, embroidery, and retail finishing services. Factory direct pricing, fast turnaround, 50 piece minimum.';
const url = `${getSiteUrl()}/services`;

export const metadata: Metadata = {
  title: {
    template: '%s | Garment Decor',
    default: 'Services | Garment Decor',
  },
  description,
  alternates: { canonical: url },
  openGraph: {
    title: 'Services | Garment Decor',
    description,
    url,
    siteName: 'Garment Decor',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services | Garment Decor',
    description,
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
