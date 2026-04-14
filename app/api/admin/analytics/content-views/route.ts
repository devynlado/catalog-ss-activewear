import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchContentViews, type ContentViewRow } from '@/lib/ga4';

export type { ContentViewRow };

export interface ContentViewsResponse {
  blogs: ContentViewRow[];
  projects: ContentViewRow[];
  source: 'ga4' | 'mock';
}

/** GET /api/admin/analytics/content-views?days=30 – admin-only. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to view analytics.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { profile } = await getServerProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);
    const dateRangeDays = [7, 30, 90].includes(days) ? days : 30;

    const propertyId = process.env.GA4_PROPERTY_ID;
    const hasCredentials =
      !!process.env.GA4_SERVICE_ACCOUNT_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (propertyId && hasCredentials) {
      try {
        const [blogs, projects] = await Promise.all([
          fetchContentViews(propertyId, '/blog/', dateRangeDays),
          fetchContentViews(propertyId, '/portfolio/', dateRangeDays),
        ]);

        return NextResponse.json({ blogs, projects, source: 'ga4' } satisfies ContentViewsResponse);
      } catch (err) {
        console.error('[Analytics] GA4 content-views fetch failed:', err);
        return NextResponse.json(
          {
            error: 'Analytics service unavailable. Ensure GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON are set.',
            code: 'GA4_ERROR',
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      blogs: getMockBlogViews(),
      projects: getMockProjectViews(),
      source: 'mock',
    } satisfies ContentViewsResponse);
  } catch (err) {
    console.error('[Analytics] content-views route error:', err);
    return NextResponse.json(
      {
        error: 'Could not load content analytics.',
        code: 'SERVER_ERROR',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

function getMockBlogViews(): ContentViewRow[] {
  return [
    { pagePath: '/blog/screen-printing/how-screen-printing-works', pageTitle: 'How Screen Printing Works – A Complete Guide', views: 1842 },
    { pagePath: '/blog/screen-printing/screen-printing-vs-dtg', pageTitle: 'Screen Printing vs DTG: Which Is Better?', views: 1235 },
    { pagePath: '/blog/embroidery/custom-embroidery-guide', pageTitle: 'Custom Embroidery Guide for Businesses', views: 987 },
    { pagePath: '/blog/screen-printing/best-blank-tshirts', pageTitle: 'Best Blank T-Shirts for Screen Printing', views: 756 },
    { pagePath: '/blog/business/starting-clothing-brand', pageTitle: 'How to Start a Clothing Brand in 2025', views: 623 },
    { pagePath: '/blog/embroidery/embroidery-vs-screen-printing', pageTitle: 'Embroidery vs Screen Printing: Pros & Cons', views: 412 },
    { pagePath: '/blog/screen-printing/screen-printing-cost', pageTitle: 'How Much Does Screen Printing Cost?', views: 389 },
    { pagePath: '/blog/business/bulk-tshirt-ordering', pageTitle: 'Bulk T-Shirt Ordering: Everything You Need to Know', views: 278 },
  ];
}

function getMockProjectViews(): ContentViewRow[] {
  return [
    { pagePath: '/portfolio/custom-jerseys-la-league', pageTitle: 'Custom Jerseys – LA Basketball League', views: 524 },
    { pagePath: '/portfolio/corporate-polos-tech-startup', pageTitle: 'Corporate Polos – Tech Startup', views: 412 },
    { pagePath: '/portfolio/band-merch-tour-tees', pageTitle: 'Band Merch – Tour T-Shirts', views: 389 },
    { pagePath: '/portfolio/restaurant-uniforms', pageTitle: 'Restaurant Staff Uniforms', views: 267 },
    { pagePath: '/portfolio/school-spirit-wear', pageTitle: 'School Spirit Wear Collection', views: 198 },
    { pagePath: '/portfolio/nonprofit-event-shirts', pageTitle: 'Nonprofit Event Shirts', views: 156 },
  ];
}
