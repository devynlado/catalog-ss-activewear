import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchLeadsByVisitorSource, type LeadBySourceRow } from '@/lib/ga4';

export type { LeadBySourceRow };

/** GET: Event and lead counts by visitor source. Admin-only. */
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
      const rows = await fetchLeadsByVisitorSource(propertyId, 30);
      return NextResponse.json({ rows, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 leads by source fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load leads by source from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const rows = getMockLeadsBySource();
  return NextResponse.json({ rows, source: 'mock' });
}

function getMockLeadsBySource(): LeadBySourceRow[] {
  return [
    { source: 'Direct', allEvents: 4200, page_view: 1800, session_start: 950, first_visit: 420, user_engagement: 1100, form_start: 85, form_submit: 42, generate_lead: 28, open_decoration_modal: 65, click: 320, add_decoration: 38, phone_click: 22, custom_quote_request: 12 },
    { source: 'Google Ads', allEvents: 3100, page_view: 1400, session_start: 720, first_visit: 380, user_engagement: 820, form_start: 120, form_submit: 68, generate_lead: 52, open_decoration_modal: 95, click: 280, add_decoration: 55, phone_click: 35, custom_quote_request: 18 },
    { source: 'Organic search', allEvents: 5800, page_view: 2600, session_start: 1350, first_visit: 520, user_engagement: 1580, form_start: 95, form_submit: 48, generate_lead: 35, open_decoration_modal: 72, click: 450, add_decoration: 42, phone_click: 28, custom_quote_request: 15 },
    { source: 'Organic Social', allEvents: 980, page_view: 420, session_start: 220, first_visit: 95, user_engagement: 280, form_start: 18, form_submit: 8, generate_lead: 5, open_decoration_modal: 12, click: 85, add_decoration: 6, phone_click: 4, custom_quote_request: 2 },
    { source: 'Organic Shopping', allEvents: 650, page_view: 280, session_start: 145, first_visit: 62, user_engagement: 185, form_start: 12, form_submit: 5, generate_lead: 3, open_decoration_modal: 8, click: 55, add_decoration: 4, phone_click: 2, custom_quote_request: 1 },
    { source: 'Referral', allEvents: 720, page_view: 310, session_start: 165, first_visit: 72, user_engagement: 205, form_start: 14, form_submit: 6, generate_lead: 4, open_decoration_modal: 10, click: 62, add_decoration: 5, phone_click: 3, custom_quote_request: 2 },
    { source: 'Cross-network', allEvents: 580, page_view: 250, session_start: 130, first_visit: 55, user_engagement: 165, form_start: 12, form_submit: 5, generate_lead: 3, open_decoration_modal: 8, click: 48, add_decoration: 4, phone_click: 2, custom_quote_request: 1 },
    { source: 'Other', allEvents: 1150, page_view: 480, session_start: 255, first_visit: 110, user_engagement: 320, form_start: 22, form_submit: 10, generate_lead: 6, open_decoration_modal: 15, click: 98, add_decoration: 8, phone_click: 5, custom_quote_request: 3 },
    { source: 'Total', allEvents: 17180, page_view: 7540, session_start: 3940, first_visit: 1714, user_engagement: 4655, form_start: 378, form_submit: 192, generate_lead: 136, open_decoration_modal: 285, click: 1398, add_decoration: 162, phone_click: 101, custom_quote_request: 54 },
  ];
}
