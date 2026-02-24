import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';

// GA4 Measurement ID from environment
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
// Google Ads Conversion ID
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID;
// Google Tag Manager Container ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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
        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
        {/* GA4 Analytics + Google Ads Conversion Tracking */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}'${process.env.NODE_ENV === 'development' ? ", { 'debug_mode': true }" : ''});
                ${GADS_ID ? `gtag('config', '${GADS_ID}');` : ''}
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-background font-sans text-text">
        {/* Google Tag Manager (noscript fallback) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
