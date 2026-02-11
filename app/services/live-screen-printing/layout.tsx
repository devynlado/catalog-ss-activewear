import { Metadata } from 'next';
import { ServiceJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Live Screen Printing for Events',
  description: 'On-site screen printing for corporate events, trade shows, and conferences. We bring the equipment, staff, and blank t-shirts. Guests watch their shirt get printed and leave with it warm. Serving California, Arizona, and Nevada.',
  keywords: [
    'live screen printing',
    'on-site screen printing',
    'event screen printing',
    'trade show screen printing',
    'corporate event t-shirt printing',
    'live t-shirt printing Los Angeles',
    'on-site printing California',
    'event activation printing',
  ],
  alternates: {
    canonical: 'https://garmentdecor.com/services/live-screen-printing',
  },
  openGraph: {
    title: 'Live Screen Printing for Events | Garment Decor',
    description: 'On-site screen printing for corporate events, trade shows, and conferences. We bring everything—guests leave with a warm, custom-printed shirt.',
    url: 'https://garmentdecor.com/services/live-screen-printing',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

export default function LiveScreenPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd
        name="Live Screen Printing for Events"
        description="On-site screen printing services for corporate events, trade shows, conferences, and brand activations. We bring the equipment, trained staff, and quality blank t-shirts. Serving California, Arizona, and Nevada."
        url="https://garmentdecor.com/services/live-screen-printing"
      />
      {children}
    </>
  );
}
