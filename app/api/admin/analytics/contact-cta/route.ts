import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchContactCTAReport, type ContactCTARow } from '@/lib/ga4';

export type { ContactCTARow };

/** GET: Top 20 pages that send traffic to /contact and their contact-page actions. Admin-only. */
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
      const rows = await fetchContactCTAReport(propertyId, 20, 30);
      return NextResponse.json({ rows, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 contact CTA fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load CTA to contact from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const rows = getMockContactCTA();
  return NextResponse.json({ rows, source: 'mock' });
}

function getMockContactCTA(): ContactCTARow[] {
  return [
    { sourcePage: '/catalog', contactPageViews: 420, formSubmissions: 45, phoneClicks: 28, emailClicks: 22, locationClicks: 18 },
    { sourcePage: '/', contactPageViews: 380, formSubmissions: 32, phoneClicks: 35, emailClicks: 20, locationClicks: 15 },
    { sourcePage: '/lp/embroidery', contactPageViews: 195, formSubmissions: 28, phoneClicks: 18, emailClicks: 12, locationClicks: 8 },
    { sourcePage: '/about', contactPageViews: 142, formSubmissions: 12, phoneClicks: 14, emailClicks: 9, locationClicks: 6 },
    { sourcePage: '/contact', contactPageViews: 128, formSubmissions: 8, phoneClicks: 10, emailClicks: 7, locationClicks: 5 },
    { sourcePage: '/quote', contactPageViews: 98, formSubmissions: 15, phoneClicks: 8, emailClicks: 6, locationClicks: 4 },
    { sourcePage: '/lp/screen-printing', contactPageViews: 85, formSubmissions: 10, phoneClicks: 6, emailClicks: 5, locationClicks: 3 },
    { sourcePage: '/services', contactPageViews: 72, formSubmissions: 9, phoneClicks: 7, emailClicks: 4, locationClicks: 2 },
    { sourcePage: '/faq', contactPageViews: 58, formSubmissions: 5, phoneClicks: 5, emailClicks: 4, locationClicks: 2 },
    { sourcePage: '/cart', contactPageViews: 45, formSubmissions: 6, phoneClicks: 4, emailClicks: 3, locationClicks: 1 },
    { sourcePage: '/pricing', contactPageViews: 38, formSubmissions: 4, phoneClicks: 3, emailClicks: 2, locationClicks: 1 },
    { sourcePage: '/checkout', contactPageViews: 28, formSubmissions: 3, phoneClicks: 2, emailClicks: 2, locationClicks: 1 },
    { sourcePage: '/product/uc500', contactPageViews: 22, formSubmissions: 2, phoneClicks: 2, emailClicks: 1, locationClicks: 0 },
    { sourcePage: '/lp/dtg', contactPageViews: 18, formSubmissions: 2, phoneClicks: 1, emailClicks: 1, locationClicks: 0 },
    { sourcePage: '/brands', contactPageViews: 15, formSubmissions: 1, phoneClicks: 1, emailClicks: 1, locationClicks: 0 },
    { sourcePage: '/terms', contactPageViews: 12, formSubmissions: 1, phoneClicks: 1, emailClicks: 0, locationClicks: 0 },
    { sourcePage: '/privacy', contactPageViews: 10, formSubmissions: 0, phoneClicks: 1, emailClicks: 0, locationClicks: 0 },
    { sourcePage: '/decorate', contactPageViews: 8, formSubmissions: 1, phoneClicks: 0, emailClicks: 0, locationClicks: 0 },
    { sourcePage: '/dashboard', contactPageViews: 6, formSubmissions: 0, phoneClicks: 0, emailClicks: 0, locationClicks: 0 },
    { sourcePage: '(direct)', contactPageViews: 52, formSubmissions: 6, phoneClicks: 5, emailClicks: 4, locationClicks: 2 },
  ];
}
