import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchPageEngagement, type PageEngagementRow } from '@/lib/ga4';

export type { PageEngagementRow };

/** GET: Page engagement metrics for a fixed list of paths. Admin-only. */
export async function GET() {
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

    const propertyId = process.env.GA4_PROPERTY_ID;
    const hasCredentials =
      !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (propertyId && hasCredentials) {
      try {
        const rows = await fetchPageEngagement(propertyId, 30);
        return NextResponse.json({ rows, source: 'ga4' });
      } catch (err) {
        console.error('[Analytics] GA4 page engagement fetch failed:', err);
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

    const rows = getMockPageEngagement();
    return NextResponse.json({ rows, source: 'mock' });
  } catch (err) {
    console.error('[Analytics] page-engagement route error:', err);
    return NextResponse.json(
      { error: 'Could not load analytics. Please try again or log in as an admin.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

const MOCK_PATHS = [
  '/', '/services/screen-printing', '/services/embroidery', '/services/jumbo-screen-printing',
  '/services/puff-screen-printing', '/services/rush', '/services/digital-screen-printing',
  '/services/simulated-process', '/services/retail-finishing', '/packages', '/services/large-orders',
  '/services/live-screen-printing', '/pricing', '/contact', '/locations/hollywood',
  '/locations/orange-county', '/locations/santa-barbara',
];

function getMockPageEngagement(): PageEngagementRow[] {
  return MOCK_PATHS.map((pagePath, i) => {
    const views = 200 + Math.floor(Math.random() * 800) + i * 30;
    const activeUsers = Math.max(1, Math.floor(views * (0.3 + Math.random() * 0.4)));
    const avgEng = 15 + Math.floor(Math.random() * 90);
    const click = Math.floor(Math.random() * 80);
    const formSubmit = Math.floor(Math.random() * 25);
    const generateLead = Math.floor(Math.random() * 15);
    return {
      pagePath,
      views,
      activeUsers,
      viewsPerUser: Math.round((views / activeUsers) * 100) / 100,
      averageEngagementTimeSeconds: avgEng,
      click,
      form_submit: formSubmit,
      generate_lead: generateLead,
    };
  });
}
