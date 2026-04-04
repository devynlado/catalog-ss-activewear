import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * PATCH /api/admin/contacts/[id]
 * Update status, mark as spam, or block email
 * Body: { status?, is_spam?, block_email?: boolean, block_reason?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceSupabase = getServiceSupabase();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { status, is_spam, block_email, block_reason } = body;

  // Fetch the contact first
  const { data: contact, error: fetchErr } = await serviceSupabase
    .from('contacts')
    .select('id, email')
    .eq('id', id)
    .single();

  if (fetchErr || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Build update payload
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (is_spam !== undefined) {
    update.is_spam = is_spam;
    if (is_spam) update.blocked_at = new Date().toISOString();
    else update.blocked_at = null;
  }

  if (Object.keys(update).length > 0) {
    const { error: updateErr } = await serviceSupabase
      .from('contacts')
      .update(update)
      .eq('id', id);

    if (updateErr) {
      console.error('[Admin Contacts] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }
  }

  // Auto-block email when marking as spam
  if (is_spam && block_email !== false) {
    const email = contact.email.trim().toLowerCase();
    await serviceSupabase
      .from('blocked_emails')
      .upsert({
        email,
        reason: block_reason || 'Marked as spam from admin',
        blocked_by: user.id,
      }, { onConflict: 'email' });

    // Mark all other contacts from this email as spam too
    await serviceSupabase
      .from('contacts')
      .update({ is_spam: true, status: 'spam', blocked_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('email', contact.email)
      .eq('is_spam', false);
  }

  // Un-spam: also remove from blocklist if explicitly un-marking
  if (is_spam === false) {
    await serviceSupabase
      .from('blocked_emails')
      .delete()
      .eq('email', contact.email.trim().toLowerCase());
  }

  return NextResponse.json({ success: true });
}
