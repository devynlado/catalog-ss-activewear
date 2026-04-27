import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/metadata';

const LOCATION_META: Record<string, { name: string; description: string }> = {
  hollywood: {
    name: 'Hollywood, CA',
    description: 'Custom screen printing and embroidery for Hollywood and LA. Movie productions, concert merch, and entertainment industry apparel. Request a quote.',
  },
  'orange-county': {
    name: 'Orange County, CA',
    description: 'Screen printing and embroidery in Orange County. Schools, corporate teams, surfwear brands. Quality custom apparel with fast turnaround.',
  },
  'santa-barbara': {
    name: 'Santa Barbara, CA',
    description: 'Custom apparel and screen printing for Santa Barbara. UCSB, wineries, coastal businesses. Premium decoration on the Central Coast.',
  },
};

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const path = `/locations/${city}`;
  const url = `${getSiteUrl()}${path}`;
  const loc = LOCATION_META[city];
  const title = loc ? `${loc.name} Screen Printing & Embroidery | Garment Decor` : 'Locations | Garment Decor';
  const description = loc?.description ?? 'Custom screen printing and embroidery near you. Request a quote from Garment Decor.';

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Garment Decor',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
