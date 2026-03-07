import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

/** PATCH: Update the order's internal admin_note and record in activity log */
export async function PATCH(
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
  const adminNote =
    body.admin_note === null || body.admin_note === undefined
      ? null
      : typeof body.admin_note === 'string'
        ? body.admin_note.trim() || null
        : null;

  const serviceSupabase = getServiceSupabase();

  const { data: order, error: fetchError } = await serviceSupabase
    .from('orders')
    .select('id, admin_note')
    .eq('id', params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { error: updateError } = await serviceSupabase
    .from('orders')
    .update({ admin_note: adminNote })
    .eq('id', params.id);

  if (updateError) {
    console.error('Failed to save admin note:', updateError);
    return NextResponse.json(
      { error: 'Failed to save note', details: updateError?.message },
      { status: 500 }
    );
  }

  const content = adminNote ?? '';
  try {
    const { data: activity, error: activityError } = await serviceSupabase
      .from('order_activities')
      .insert({
        order_id: params.id,
        user_id: user.id,
        activity_type: 'note',
        details: { content },
      })
      .select()
      .single();

    if (activityError) {
      console.error('Failed to insert note activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      admin_note: adminNote,
      activity: activity ?? null,
      user: { full_name: profile.full_name, avatar_url: profile.avatar_url },
    });
  } catch (err) {
    console.error('Note activity insert error:', err);
    return NextResponse.json({
      success: true,
      admin_note: adminNote,
      activity: null,
      user: { full_name: profile.full_name, avatar_url: profile.avatar_url },
    });
  }
}
