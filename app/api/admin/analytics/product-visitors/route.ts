import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import {
  fetchProductPageVisitorsByChannel,
  type ProductVisitorRow,
} from '@/lib/ga4';

export type { ProductVisitorRow };

/** GET: Top 30 most visited product pages with visitor origins by channel. Admin-only. */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
  const endDate = request.nextUrl.searchParams.get('endDate') || undefined;

  const propertyId = process.env.GA4_PROPERTY_ID;
  const hasCredentials =
    !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (propertyId && hasCredentials) {
    try {
      const pages = await fetchProductPageVisitorsByChannel(propertyId, 30, 30, startDate, endDate);
      return NextResponse.json({ pages, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 product visitors fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load product visitor analytics from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const pages = getMockProductVisitorData();
  return NextResponse.json({ pages, source: 'mock' });
}

function getMockProductVisitorData(): ProductVisitorRow[] {
  const products = [
    'gildan-64000', 'bella-canvas-3001', 'next-level-3600', 'gildan-18000',
    'comfort-colors-1717', 'gildan-5000', 'bella-canvas-3001cvc', 'champion-t425',
    'hanes-5250', 'port-company-pc61', 'gildan-18500', 'next-level-6210',
    'comfort-colors-6030', 'gildan-12000', 'bella-canvas-3480',
  ];

  return products.map((slug) => {
    const googleAds = Math.floor(Math.random() * 120) + 10;
    const organicSearch = Math.floor(Math.random() * 200) + 30;
    const organicSocial = Math.floor(Math.random() * 60) + 5;
    const organicShopping = Math.floor(Math.random() * 40) + 2;
    const referral = Math.floor(Math.random() * 50) + 5;
    const crossNetwork = Math.floor(Math.random() * 30) + 2;
    const other = Math.floor(Math.random() * 40) + 5;
    const total = googleAds + organicSearch + organicSocial + organicShopping + referral + crossNetwork + other;
    return {
      pagePath: `/product/${slug}`,
      pageTitle: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      googleAds,
      organicSearch,
      organicSocial,
      organicShopping,
      referral,
      crossNetwork,
      other,
      total,
    };
  });
}
