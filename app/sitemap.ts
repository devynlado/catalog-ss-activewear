import { MetadataRoute } from 'next';
import { POPULAR_PRODUCTS } from '@/lib/popular-products';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getProjectSlugs } from '@/lib/sanity';

// Generate slug from brand and style number (matches product-sync.ts logic)
function generateSlug(brand: string, styleNumber: string): string {
  return `${brand}-${styleNumber}`
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get unique product slugs from popular products for product pages
const popularProductSlugs = [...new Set(
  POPULAR_PRODUCTS.map(p => generateSlug(p.brand, p.styleNumber))
)];

// Fetch guides from database
async function getGuides(): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('categories')
      .select('slug')
      .eq('type', 'guide')
      .eq('is_active', true);
    
    if (!data) return [];
    return (data as { slug: string }[]).map(g => g.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/quote`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Service pages
  const services = [
    'screen-printing',
    'embroidery',
    'digital-screen-printing',
    'jumbo-screen-printing',
    'puff-screen-printing',
    'simulated-process',
    'retail-finishing',
    'rush',
  ];
  
  const servicePages: MetadataRoute.Sitemap = services.map(service => ({
    url: `${baseUrl}/services/${service}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Location pages
  const locations = ['hollywood', 'orange-county', 'santa-barbara'];
  
  const locationPages: MetadataRoute.Sitemap = locations.map(location => ({
    url: `${baseUrl}/locations/${location}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Resource pages
  const resources = ['embroidery-guide', 'screen-printing-guide'];
  
  const resourcePages: MetadataRoute.Sitemap = resources.map(resource => ({
    url: `${baseUrl}/resources/${resource}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Portfolio pages (from Sanity CMS)
  let portfolioSlugs: string[] = [];
  try {
    portfolioSlugs = await getProjectSlugs();
  } catch {
    // fallback if Sanity unavailable
  }
  const portfolioPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/portfolio/archive`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    },
    ...portfolioSlugs.map((slug) => ({
      url: `${baseUrl}/portfolio/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  // Catalog category pages
  const categories = [
    't-shirts',
    'sweatshirts',
    'polos',
    'jackets',
    'headwear',
    'bottoms',
    'bags',
    'accessories',
    'womens',
    'youth',
    'activewear',
  ];
  
  const catalogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    ...categories.map(category => ({
      url: `${baseUrl}/catalog/${category}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];

  // Product pages (popular products only) - using SEO-friendly slugs
  const productPages: MetadataRoute.Sitemap = popularProductSlugs.map(slug => ({
    url: `${baseUrl}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Guide pages (dynamic from database)
  const guideSlugs = await getGuides();
  const guidePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...guideSlugs.map(slug => ({
      url: `${baseUrl}/guides/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return [
    ...staticPages,
    ...servicePages,
    ...locationPages,
    ...resourcePages,
    ...portfolioPages,
    ...catalogPages,
    ...productPages,
    ...guidePages,
  ];
}
