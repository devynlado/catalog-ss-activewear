import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import {
  fetchTopPageVisitorsByChannel,
  type PageVisitorRow,
} from '@/lib/ga4';

export type { PageVisitorRow };

/** GET: Top 20 most visited pages with visitor origins by channel. Admin-only. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  const hasCredentials =
    !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (propertyId && hasCredentials) {
    try {
      const pages = await fetchTopPageVisitorsByChannel(propertyId, 20, 30);
      return NextResponse.json({ pages, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load analytics from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const pages = getMockPageVisitorData();
  return NextResponse.json({ pages, source: 'mock' });
}

/** Mock data when GA4 is not configured (missing GA4_PROPERTY_ID or GA4_SERVICE_ACCOUNT_JSON). */
function getMockPageVisitorData(): PageVisitorRow[] {
  const paths = [
    { path: '/', title: 'Home' },
    { path: '/catalog', title: 'Catalog' },
    { path: '/product/ultraclub-uc500', title: 'Product - UltraClub UC500' },
    { path: '/cart', title: 'Cart' },
    { path: '/checkout', title: 'Checkout' },
    { path: '/contact', title: 'Contact' },
    { path: '/services/screen-printing', title: 'Screen Printing' },
    { path: '/services/embroidery', title: 'Embroidery' },
    { path: '/quote', title: 'Quote Request' },
    { path: '/about', title: 'About' },
    { path: '/pricing', title: 'Pricing' },
    { path: '/product/bella-canvas-3001', title: 'Product - Bella Canvas 3001' },
    { path: '/checkout/success', title: 'Order Confirmation' },
    { path: '/lp/screen-printing', title: 'LP - Screen Printing' },
    { path: '/privacy', title: 'Privacy Policy' },
    { path: '/services/large-orders', title: 'Large Orders' },
    { path: '/product/next-level-3600', title: 'Product - Next Level 3600' },
    { path: '/lp/embroidery', title: 'LP - Embroidery' },
    { path: '/dashboard', title: 'Customer Dashboard' },
    { path: '/login', title: 'Login' },
  ];

  return paths.map(({ path, title }, i) => {
    const direct = Math.max(0, 80 + Math.floor(Math.random() * 200) - 50 * (i % 3));
    const googleAds = Math.max(0, 40 + Math.floor(Math.random() * 120));
    const organicSearch = Math.max(0, 120 + Math.floor(Math.random() * 180));
    const organicSocial = Math.max(0, 20 + Math.floor(Math.random() * 80));
    const organicShopping = Math.max(0, 10 + Math.floor(Math.random() * 40));
    const referral = Math.max(0, 15 + Math.floor(Math.random() * 60));
    const paidShopping = Math.max(0, 5 + Math.floor(Math.random() * 25));
    const paidSocial = Math.max(0, 25 + Math.floor(Math.random() * 75));
    const crossNetwork = Math.max(0, 8 + Math.floor(Math.random() * 35));
    const other = Math.max(0, 10 + Math.floor(Math.random() * 50));
    const total =
      direct +
      googleAds +
      organicSearch +
      organicSocial +
      organicShopping +
      referral +
      paidShopping +
      paidSocial +
      crossNetwork +
      other;
    return {
      pagePath: path,
      pageTitle: title,
      direct,
      googleAds,
      organicSearch,
      organicSocial,
      organicShopping,
      referral,
      paidShopping,
      paidSocial,
      crossNetwork,
      other,
      total,
    };
  });
}
