/**
 * Quick-link suggestions for the header search typeahead.
 *
 * Two suggestion families are derived here (both resolved fully client-side,
 * zero network cost):
 *   - Pages  : curated static routes (portfolio, pricing, services, guides…)
 *   - Categories : built from the product taxonomy (MAIN_CATEGORIES +
 *     product-type SUB_CATEGORIES), linking to /catalog?category=<slug>.
 *
 * Product suggestions are fetched separately from the cache-backed
 * /api/products endpoint inside the HeaderSearch component.
 */

import { MAIN_CATEGORIES, SUB_CATEGORIES } from './category-taxonomy';

export type QuickLinkType = 'page' | 'category';

export interface QuickLink {
  type: QuickLinkType;
  label: string;
  /** Optional context line, e.g. a subcategory's parent ("Sweatshirts"). */
  sublabel?: string;
  href: string;
  /** Lowercase terms used for matching (aliases, slugs, synonyms). */
  keywords: string[];
}

// ── Curated page links ─────────────────────────────────────────────────────
export const PAGE_LINKS: QuickLink[] = [
  {
    type: 'page',
    label: 'Our Portfolio',
    sublabel: 'See our past work',
    href: '/portfolio',
    keywords: ['portfolio', 'work', 'examples', 'gallery', 'projects', 'case studies'],
  },
  {
    type: 'page',
    label: 'Pricing Calculator',
    sublabel: 'Estimate your cost',
    href: '/pricing',
    keywords: ['pricing', 'price', 'cost', 'calculator', 'estimate', 'how much'],
  },
  {
    type: 'page',
    label: 'Request a Quote',
    sublabel: 'Start a custom quote',
    href: '/quote',
    keywords: ['quote', 'custom quote', 'request quote', 'get a quote'],
  },
  {
    type: 'page',
    label: 'Screen Printing',
    sublabel: 'Service',
    href: '/services/screen-printing',
    keywords: ['screen printing', 'screenprint', 'printing', 'print', 'silk screen'],
  },
  {
    type: 'page',
    label: 'Embroidery',
    sublabel: 'Service',
    href: '/services/embroidery',
    keywords: ['embroidery', 'embroider', 'stitch', 'monogram'],
  },
  {
    type: 'page',
    label: 'Digital Screen Printing',
    sublabel: 'Service',
    href: '/services/digital-screen-printing',
    keywords: ['digital', 'digital screen printing', 'dtg', 'digital print'],
  },
  {
    type: 'page',
    label: 'Jumbo Screen Printing',
    sublabel: 'Service',
    href: '/services/jumbo-screen-printing',
    keywords: ['jumbo', 'jumbo print', 'oversized print', 'large print'],
  },
  {
    type: 'page',
    label: 'Live Screen Printing',
    sublabel: 'Service',
    href: '/services/live-screen-printing',
    keywords: ['live', 'live printing', 'live screen printing', 'event printing', 'on site'],
  },
  {
    type: 'page',
    label: 'Retail Finishing',
    sublabel: 'Service',
    href: '/services/retail-finishing',
    keywords: ['finishing', 'retail finishing', 'tagging', 'folding', 'polybag', 'hang tag'],
  },
  {
    type: 'page',
    label: 'Rush Orders',
    sublabel: 'Service',
    href: '/services/rush',
    keywords: ['rush', 'fast', 'urgent', 'quick turnaround', 'expedited'],
  },
  {
    type: 'page',
    label: 'Screen Printing Guide',
    sublabel: 'Resource',
    href: '/resources/screen-printing-guide',
    keywords: ['screen printing guide', 'printing guide', 'guide'],
  },
  {
    type: 'page',
    label: 'Embroidery Guide',
    sublabel: 'Resource',
    href: '/resources/embroidery-guide',
    keywords: ['embroidery guide', 'guide'],
  },
  {
    type: 'page',
    label: 'Track My Order',
    sublabel: 'Orders',
    href: '/orders',
    keywords: ['order', 'orders', 'track', 'track order', 'my order', 'status'],
  },
  {
    type: 'page',
    label: 'Packages',
    sublabel: 'Ready-made bundles',
    href: '/packages',
    keywords: ['package', 'packages', 'bundle', 'deal', 'kit'],
  },
  {
    type: 'page',
    label: 'FAQ',
    sublabel: 'Help',
    href: '/faq',
    keywords: ['faq', 'help', 'questions', 'support'],
  },
  {
    type: 'page',
    label: 'About Us',
    sublabel: 'Company',
    href: '/about',
    keywords: ['about', 'about us', 'company', 'who we are'],
  },
  {
    type: 'page',
    label: 'Contact',
    sublabel: 'Get in touch',
    href: '/contact',
    keywords: ['contact', 'contact us', 'phone', 'email', 'reach us'],
  },
  {
    type: 'page',
    label: 'Blog',
    sublabel: 'Articles',
    href: '/blog',
    keywords: ['blog', 'articles', 'news', 'posts'],
  },
];

// ── Category links (derived from the product taxonomy) ─────────────────────
function buildCategoryLinks(): QuickLink[] {
  const links: QuickLink[] = [];

  // Main navigation categories (T-Shirts, Headwear, Bags…)
  for (const { name, slug } of Object.values(MAIN_CATEGORIES)) {
    links.push({
      type: 'category',
      label: name,
      sublabel: 'Category',
      href: `/catalog?category=${slug}`,
      keywords: [name.toLowerCase(), slug, slug.replace(/-/g, ' ')],
    });
  }

  // Product-type subcategories (Hoodies, Beanies, Tote Bags…). We skip
  // attribute-only subcategories (Cotton, Heavyweight…) since those need
  // parent context and aren't intuitive standalone destinations.
  for (const sub of Object.values(SUB_CATEGORIES)) {
    if (!sub.isProductType) continue;
    const parent = MAIN_CATEGORIES[sub.parentId];
    links.push({
      type: 'category',
      label: sub.name,
      sublabel: parent ? parent.name : 'Category',
      href: `/catalog?category=${sub.slug}`,
      keywords: [sub.name.toLowerCase(), sub.slug, sub.slug.replace(/-/g, ' ')],
    });
  }

  return links;
}

export const CATEGORY_LINKS: QuickLink[] = buildCategoryLinks();

// ── Matching ───────────────────────────────────────────────────────────────
// Lower score = better match. Infinity = no match.
function scoreLink(link: QuickLink, q: string): number {
  const label = link.label.toLowerCase();
  if (label === q) return 0;
  if (label.startsWith(q)) return 1;
  if (link.keywords.some((k) => k === q || k.startsWith(q))) return 2;
  if (label.includes(q) || link.keywords.some((k) => k.includes(q))) return 3;
  return Infinity;
}

function filterAndRank(links: QuickLink[], q: string, limit: number): QuickLink[] {
  return links
    .map((link) => ({ link, score: scoreLink(link, q) }))
    .filter((x) => x.score !== Infinity)
    .sort((a, b) => a.score - b.score || a.link.label.localeCompare(b.link.label))
    .slice(0, limit)
    .map((x) => x.link);
}

export interface QuickLinkMatches {
  pages: QuickLink[];
  categories: QuickLink[];
}

export function matchQuickLinks(
  query: string,
  opts: { maxPages?: number; maxCategories?: number } = {},
): QuickLinkMatches {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { pages: [], categories: [] };
  return {
    pages: filterAndRank(PAGE_LINKS, q, opts.maxPages ?? 4),
    categories: filterAndRank(CATEGORY_LINKS, q, opts.maxCategories ?? 5),
  };
}
