import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { date, platform, spend, impressions, clicks, notes } = body;

  if (!date || !spend || spend <= 0) {
    return NextResponse.json({ error: 'Date and spend amount are required' }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

  // Upsert — update if same date+platform exists, insert otherwise
  const { data, error } = await serviceSupabase
    .from('ad_spend_entries')
    .upsert(
      {
        date,
        platform: platform || 'google_pmax',
        spend,
        impressions: impressions || null,
        clicks: clicks || null,
        notes: notes || null,
        created_by: user.id,
      },
      { onConflict: 'date,platform' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save ad spend:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
