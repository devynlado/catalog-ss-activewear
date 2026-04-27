import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase';

const AUTH_COOKIE_NAME = 'admin_auth';
const AUTH_COOKIE_VALUE = 'authenticated';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === AUTH_COOKIE_VALUE;
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Cast to any to bypass strict Supabase table typing
    const supabase = createServerSupabaseClient() as any;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      // Get summary counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [
        quotesTotal,
        quotesToday,
        quotesNew,
        contactsTotal,
        contactsToday,
        contactsNew,
        abandonedTotal,
        exitTotal,
      ] = await Promise.all([
        supabase.from('quotes').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('abandoned_carts').select('id', { count: 'exact', head: true }).eq('recovered', false),
        supabase.from('exit_captures').select('id', { count: 'exact', head: true }),
      ]);

      return NextResponse.json({
        quotes: {
          total: quotesTotal.count || 0,
          today: quotesToday.count || 0,
          new: quotesNew.count || 0,
        },
        contacts: {
          total: contactsTotal.count || 0,
          today: contactsToday.count || 0,
          new: contactsNew.count || 0,
        },
        abandoned: {
          total: abandonedTotal.count || 0,
        },
        exitCaptures: {
          total: exitTotal.count || 0,
        },
      });
    }

    if (type === 'quotes') {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === 'contacts') {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === 'abandoned') {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === 'exit') {
      const { data, error } = await supabase
        .from('exit_captures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Admin data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Update status
export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { table, id, status } = body;

    if (!table || !id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Cast to any to bypass strict Supabase table typing
    const supabase = createServerSupabaseClient() as any;
    
    if (table === 'quotes') {
      await supabase.from('quotes').update({ status }).eq('id', id);
    } else if (table === 'contacts') {
      await supabase.from('contacts').update({ status }).eq('id', id);
    } else if (table === 'abandoned_carts') {
      await supabase.from('abandoned_carts').update({ recovered: status === 'recovered' }).eq('id', id);
    } else {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update error:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}
