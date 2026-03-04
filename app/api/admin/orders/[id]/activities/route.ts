import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const serviceSupabase = getServiceSupabase();

  const { data: activities, error } = await serviceSupabase
    .from('order_activities')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }

  const userIds = [...new Set((activities || []).map(a => a.user_id).filter(Boolean))];
  let userMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: users } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (users) {
      userMap = Object.fromEntries(users.map(u => [u.id, { full_name: u.full_name, avatar_url: u.avatar_url }]));
    }
  }

  const enriched = (activities || []).map(a => ({
    ...a,
    user: a.user_id ? userMap[a.user_id] || { full_name: 'Unknown', avatar_url: null } : null,
  }));

  return NextResponse.json({ activities: enriched });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { activity_type, details } = body;

  if (activity_type !== 'note') {
    return NextResponse.json({ error: 'Only notes can be added manually' }, { status: 400 });
  }

  if (!details?.content?.trim()) {
    return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

  const { data: activity, error } = await serviceSupabase
    .from('order_activities')
    .insert({
      order_id: params.id,
      user_id: user.id,
      activity_type: 'note',
      details: { content: details.content.trim() },
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }

  return NextResponse.json({
    activity: {
      ...activity,
      user: { full_name: profile.full_name, avatar_url: profile.avatar_url },
    },
  });
}
