import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Garment Decor | Custom Screen Printing & Embroidery Services',
    template: '%s | Garment Decor',
  },
  description: 'Professional screen printing, embroidery, and custom apparel decoration in Southern California. Wholesale pricing, fast turnaround, and premium quality for businesses.',
  keywords: [
    'screen printing',
    'custom embroidery',
    'wholesale apparel',
    'custom t-shirts',
    'bulk printing',
    'corporate apparel',
    'promotional products',
    'Los Angeles screen printing',
  ],
  authors: [{ name: 'Garment Decor' }],
  creator: 'Garment Decor',
  publisher: 'Garment Decor',
  icons: {
    icon: '/images/brand/favicon.svg',
    apple: '/images/brand/logo-circle-dark.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Garment Decor',
    title: 'Garment Decor | Custom Screen Printing & Embroidery Services',
    description: 'Professional screen printing, embroidery, and custom apparel decoration in Southern California. Wholesale pricing, fast turnaround, and premium quality for businesses.',
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Garment Decor - Custom Screen Printing & Embroidery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Garment Decor | Custom Screen Printing & Embroidery',
    description: 'Professional screen printing, embroidery, and custom apparel decoration in Southern California.',
    images: ['/images/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here after setting up
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className="min-h-screen bg-background font-sans text-text">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
