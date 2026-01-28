import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/quote/',        // Don't index quote pages (private user data)
          '/_next/',        // Next.js internal
          '/admin/',        // Admin pages if any
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
