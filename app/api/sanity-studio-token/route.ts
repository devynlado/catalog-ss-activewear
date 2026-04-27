import { NextResponse } from 'next/server';
import { getServerProfile } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Returns the Sanity API token only for authenticated admins.
 * Used by the embedded Studio at /studio to auto-login without Sanity's login screen.
 * Token is never exposed in client bundles; only returned after server-side admin check.
 */
export async function GET() {
  try {
    const { profile } = await getServerProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const token = process.env.SANITY_API_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Studio token not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Sanity studio token error:', error);
    return NextResponse.json(
      { error: 'Failed to get studio token' },
      { status: 500 }
    );
  }
}
