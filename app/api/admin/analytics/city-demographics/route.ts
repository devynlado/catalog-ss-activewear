import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import {
  fetchTopUSCitiesDemographics,
  type CityDemographicsRow,
} from '@/lib/ga4';

export type { CityDemographicsRow };

/** GET: Top 15 US cities by visitors with demographics. Admin-only. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please log in to view analytics.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { profile } = await getServerProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required. Please log in as an admin.', code: 'FORBIDDEN' }, { status: 403 });
    }

    const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
    const endDate = request.nextUrl.searchParams.get('endDate') || undefined;

    const propertyId = process.env.GA4_PROPERTY_ID;
    const hasCredentials =
      !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (propertyId && hasCredentials) {
      try {
        const cities = await fetchTopUSCitiesDemographics(propertyId, 15, 30, startDate, endDate);
        return NextResponse.json({ cities, source: 'ga4' });
      } catch (err) {
        console.error('[Analytics] GA4 city demographics fetch failed:', err);
        return NextResponse.json(
          {
            error: 'Analytics service unavailable. Set GA4 env vars in Vercel for real data, or leave unset for sample data.',
            code: 'GA4_ERROR',
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 502 }
        );
      }
    }

    const cities = getMockCityDemographicsData();
    return NextResponse.json({ cities, source: 'mock' });
  } catch (err) {
    console.error('[Analytics] city-demographics route error:', err);
    return NextResponse.json(
      { error: 'Could not load analytics. Please try again or log in as an admin.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

function getMockCityDemographicsData(): CityDemographicsRow[] {
  const cityNames = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  ];
  return cityNames.map((city, i) => ({
    city,
    newUsers: 100 + Math.floor(Math.random() * 400) + i * 20,
    returnUsers: 80 + Math.floor(Math.random() * 300) + i * 15,
    paidSearch: 30 + Math.floor(Math.random() * 100),
    organicSearch: 120 + Math.floor(Math.random() * 200),
    organicSocial: 20 + Math.floor(Math.random() * 80),
    crossNetwork: 15 + Math.floor(Math.random() * 50),
    averageEngagementTimeSeconds: 60 + Math.floor(Math.random() * 180),
    totalRevenue: Math.floor(Math.random() * 5000),
  }));
}
