import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(serviceSupabase: ReturnType<typeof getServiceSupabase>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) return null;
  return user;
}

/**
 * POST /api/admin/contacts/block-email
 * Block an email address from future contact form submissions
 * Body: { email, reason? }
 */
export async function POST(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, reason } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await serviceSupabase
    .from('blocked_emails')
    .upsert({
      email: normalizedEmail,
      reason: reason || null,
      blocked_by: user.id,
    }, { onConflict: 'email' });

  if (error) {
    console.error('[Block Email] Insert error:', error);
    return NextResponse.json({ error: 'Failed to block email' }, { status: 500 });
  }

  // Mark all existing contacts from this email as spam
  await serviceSupabase
    .from('contacts')
    .update({ is_spam: true, status: 'spam', blocked_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('email', email.trim())
    .eq('is_spam', false);

  return NextResponse.json({ success: true, message: `${normalizedEmail} blocked` });
}

/**
 * DELETE /api/admin/contacts/block-email
 * Unblock an email address
 * Body: { email }
 */
export async function DELETE(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  await serviceSupabase
    .from('blocked_emails')
    .delete()
    .eq('email', normalizedEmail);

  // Un-spam contacts from this email
  await serviceSupabase
    .from('contacts')
    .update({ is_spam: false, status: 'new', blocked_at: null } as Record<string, unknown>)
    .ilike('email', normalizedEmail);

  return NextResponse.json({ success: true, message: `${normalizedEmail} unblocked` });
}

/**
 * GET /api/admin/contacts/block-email
 * List all blocked emails
 */
export async function GET(request: NextRequest) {
  const serviceSupabase = getServiceSupabase();
  const user = await verifyAdmin(serviceSupabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: blocked, error } = await serviceSupabase
    .from('blocked_emails')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch blocked emails' }, { status: 500 });
  }

  return NextResponse.json({ blocked: blocked || [] });
}
