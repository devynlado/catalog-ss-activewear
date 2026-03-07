import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchSalesByVisitorSource, type SalesBySourceRow } from '@/lib/ga4';

export type { SalesBySourceRow };

/** GET: Ecommerce funnel metrics by visitor source. Admin-only. */
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
      const rows = await fetchSalesByVisitorSource(propertyId, 30);
      return NextResponse.json({ rows, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 sales by source fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load sales by source from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const rows = getMockSalesBySource();
  return NextResponse.json({ rows, source: 'mock' });
}

function getMockSalesBySource(): SalesBySourceRow[] {
  return [
    { source: 'Paid search (Google Ads)', productsViewed: 1250, addedToCart: 340, valueAddedToCart: 18200, enteredCheckout: 180, valueCheckout: 9500, productsPurchased: 95, totalPurchases: 5200 },
    { source: 'Organic Search', productsViewed: 3200, addedToCart: 720, valueAddedToCart: 38500, enteredCheckout: 420, valueCheckout: 22000, productsPurchased: 280, totalPurchases: 15200 },
    { source: 'Organic Social', productsViewed: 580, addedToCart: 95, valueAddedToCart: 5100, enteredCheckout: 45, valueCheckout: 2400, productsPurchased: 22, totalPurchases: 1180 },
    { source: 'Organic Shopping', productsViewed: 420, addedToCart: 88, valueAddedToCart: 4700, enteredCheckout: 38, valueCheckout: 2000, productsPurchased: 18, totalPurchases: 980 },
    { source: 'Referral', productsViewed: 310, addedToCart: 62, valueAddedToCart: 3300, enteredCheckout: 28, valueCheckout: 1500, productsPurchased: 12, totalPurchases: 650 },
    { source: 'Cross-network', productsViewed: 180, addedToCart: 35, valueAddedToCart: 1900, enteredCheckout: 18, valueCheckout: 950, productsPurchased: 8, totalPurchases: 420 },
  ];
}
