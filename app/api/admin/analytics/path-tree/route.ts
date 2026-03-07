import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { fetchHomepagePathTree, type PathTreeNode } from '@/lib/ga4';

export type { PathTreeNode };

/** GET: Three-level path tree from homepage. Admin-only. */
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
      const tree = await fetchHomepagePathTree(propertyId, 15, 4, 3, 30);
      return NextResponse.json({ tree, source: 'ga4' });
    } catch (err) {
      console.error('[Analytics] GA4 path tree fetch failed:', err);
      return NextResponse.json(
        {
          error: 'Failed to load path tree from GA4',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  const tree = getMockPathTree();
  return NextResponse.json({ tree, source: 'mock' });
}

function getMockPathTree(): PathTreeNode {
  return {
    path: '/',
    sessions: 1200,
    children: [
      { path: '/catalog', sessions: 420, children: [{ path: '/product/uc500', sessions: 180, children: [{ path: '/cart', sessions: 70 }, { path: '/contact', sessions: 35 }] }, { path: '/cart', sessions: 95, children: [{ path: '/checkout', sessions: 50 }] }, { path: '/contact', sessions: 50, children: [] }] },
      { path: '/lp/embroidery', sessions: 280, children: [{ path: '/contact', sessions: 120, children: [{ path: '/quote', sessions: 40 }] }, { path: '/quote', sessions: 80, children: [] }, { path: '/lp/screen-printing', sessions: 40, children: [] }] },
      { path: '/contact', sessions: 195, children: [{ path: '/', sessions: 60, children: [] }, { path: '/quote', sessions: 55, children: [] }, { path: '/catalog', sessions: 45, children: [] }] },
      { path: '/cart', sessions: 165, children: [{ path: '/checkout', sessions: 90, children: [{ path: '/checkout/success', sessions: 75 }] }, { path: '/catalog', sessions: 40, children: [] }, { path: '/product/uc500', sessions: 25, children: [] }] },
      { path: '/lp/screen-printing', sessions: 140, children: [{ path: '/contact', sessions: 70, children: [] }, { path: '/quote', sessions: 45, children: [] }, { path: '/catalog', sessions: 20, children: [] }] },
      { path: '/quote', sessions: 110, children: [{ path: '/contact', sessions: 35, children: [] }, { path: '/dashboard', sessions: 30, children: [] }, { path: '/catalog', sessions: 25, children: [] }] },
      { path: '/checkout', sessions: 90, children: [{ path: '/checkout/success', sessions: 75, children: [] }, { path: '/cart', sessions: 10, children: [] }] },
      { path: '/about', sessions: 85, children: [{ path: '/contact', sessions: 40, children: [] }, { path: '/catalog', sessions: 25, children: [] }] },
      { path: '/dashboard', sessions: 72, children: [{ path: '/orders', sessions: 35, children: [] }, { path: '/account', sessions: 20, children: [] }] },
      { path: '/login', sessions: 68, children: [{ path: '/dashboard', sessions: 45, children: [] }, { path: '/', sessions: 15, children: [] }] },
      { path: '/product/uc500', sessions: 58, children: [{ path: '/cart', sessions: 30, children: [] }, { path: '/catalog', sessions: 15, children: [] }] },
      { path: '/lp/dtg', sessions: 52, children: [{ path: '/quote', sessions: 28, children: [] }, { path: '/contact', sessions: 18, children: [] }] },
      { path: '/faq', sessions: 48, children: [{ path: '/contact', sessions: 22, children: [] }, { path: '/catalog', sessions: 12, children: [] }] },
      { path: '/account', sessions: 42, children: [{ path: '/orders', sessions: 25, children: [] }, { path: '/', sessions: 10, children: [] }] },
      { path: '/checkout/success', sessions: 38, children: [{ path: '/catalog', sessions: 20, children: [] }, { path: '/', sessions: 10, children: [] }] },
      { path: '/orders', sessions: 35, children: [{ path: '/dashboard', sessions: 18, children: [] }, { path: '/catalog', sessions: 8, children: [] }] },
    ],
  };
}
