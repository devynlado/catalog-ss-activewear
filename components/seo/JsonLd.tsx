/**
 * JSON-LD Structured Data Components for SEO
 * 
 * These components add structured data to pages for rich snippets in Google Search.
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Generic JSON-LD component - renders any structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization Schema - Use in root layout
 * Helps with brand searches and sitelinks
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://garmentdecor.com/#organization',
    name: 'Garment Decor',
    alternateName: 'Garment Decor Custom Apparel',
    url: 'https://garmentdecor.com',
    logo: 'https://garmentdecor.com/images/brand/logo-circle-dark.png',
    image: 'https://garmentdecor.com/images/brand/logo-wordmark-dark.png',
    description: 'Professional screen printing, embroidery, and custom apparel decoration services in Southern California. Serving businesses with wholesale pricing and fast turnaround.',
    telephone: '+1-855-942-7636',
    email: 'sales@garmentdecor.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '4950 Arrow Hwy Suite 4',
      addressLocality: 'Montclair',
      addressRegion: 'CA',
      postalCode: '91763',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 34.0775,
      longitude: -117.6897,
    },
    areaServed: [
      { '@type': 'City', name: 'Los Angeles' },
      { '@type': 'City', name: 'Orange County' },
      { '@type': 'City', name: 'Santa Barbara' },
      { '@type': 'State', name: 'California' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    priceRange: '$$',
    paymentAccepted: ['Cash', 'Credit Card', 'Check', 'Wire Transfer'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Custom Decoration Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Screen Printing',
            url: 'https://garmentdecor.com/services/screen-printing',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Embroidery',
            url: 'https://garmentdecor.com/services/embroidery',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Digital Screen Printing',
            url: 'https://garmentdecor.com/services/digital-screen-printing',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Jumbo Printing',
            url: 'https://garmentdecor.com/services/jumbo-screen-printing',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Puff Printing',
            url: 'https://garmentdecor.com/services/puff-screen-printing',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Retail Finishing',
            url: 'https://garmentdecor.com/services/retail-finishing',
          },
        },
      ],
    },
    sameAs: [
      'https://www.instagram.com/garmentdecor',
      'https://www.facebook.com/garmentdecor',
    ],
  };

  return <JsonLd data={data} />;
}

/**
 * Product Schema - Use on product pages
 */
interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku: string;
  price: number;
  currency?: string;
  url: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

export function ProductJsonLd({
  name,
  description,
  image,
  brand,
  sku,
  price,
  currency = 'USD',
  url,
  availability = 'InStock',
}: ProductJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    sku,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Garment Decor',
      },
    },
  };

  return <JsonLd data={data} />;
}

/**
 * Service Schema - Use on service pages
 */
interface ServiceJsonLdProps {
  name: string;
  description: string;
  url: string;
  image?: string;
}

export function ServiceJsonLd({ name, description, url, image }: ServiceJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    ...(image && { image }),
    provider: {
      '@type': 'LocalBusiness',
      name: 'Garment Decor',
      url: 'https://garmentdecor.com',
    },
    areaServed: {
      '@type': 'State',
      name: 'California',
    },
    serviceType: 'Custom Apparel Decoration',
  };

  return <JsonLd data={data} />;
}

/**
 * FAQ Schema - Use on FAQ pages for rich snippets
 */
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  items: FAQItem[];
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Breadcrumb Schema - Use on catalog/product pages
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

/**
 * Article Schema - Use on blog posts, guides, portfolio items
 */
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = 'Garment Decor',
}: ArticleJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(image && { image }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Garment Decor',
      logo: {
        '@type': 'ImageObject',
        url: 'https://garmentdecor.com/images/brand/logo-circle-dark.png',
      },
    },
  };

  return <JsonLd data={data} />;
}
