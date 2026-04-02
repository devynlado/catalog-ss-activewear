import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: orderId } = await params;
  const db = getServiceSupabase();

  const { count } = await db
    .from('order_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .eq('sender_type', 'customer')
    .is('read_at', null);

  let latestMessage = '';
  if ((count ?? 0) > 0) {
    const { data } = await db
      .from('order_chat_messages')
      .select('content')
      .eq('order_id', orderId)
      .eq('sender_type', 'customer')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    latestMessage = data?.content || '';
  }

  return NextResponse.json({ count: count ?? 0, latestMessage });
}
