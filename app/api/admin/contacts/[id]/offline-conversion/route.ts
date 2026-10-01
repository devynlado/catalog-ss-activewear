import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logAdminActivity } from '@/lib/admin-audit';
import {
  uploadQualifiedLead,
  retractQualifiedLead,
  isGoogleAdsConfigured,
} from '@/lib/google-ads';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/contacts/[id]/offline-conversion
 * Body: { action: 'upload' | 'retract' }
 *
 * - 'upload'  → report this lead to Google Ads as a qualified conversion
 *               (keyed by its stored gclid/gbraid/wbraid).
 * - 'retract' → cancel a previously-uploaded qualified conversion.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceSupabase = getServiceSupabase();

  // --- Auth: admin or sales_rep only ---
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
  if (!profile || !['admin', 'sales_rep'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isGoogleAdsConfigured()) {
    return NextResponse.json(
      { error: 'Google Ads integration is not configured on the server.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action as 'upload' | 'retract' | undefined;
  if (action !== 'upload' && action !== 'retract') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // --- Load the contact ---
  const { data: contact, error: fetchErr } = await serviceSupabase
    .from('contacts')
    .select('id, gclid, gbraid, wbraid, offline_conv_status')
    .eq('id', id)
    .single();

  if (fetchErr || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const c = contact as {
    id: string;
    gclid: string | null;
    gbraid: string | null;
    wbraid: string | null;
    offline_conv_status: string | null;
  };

  // ── Upload ────────────────────────────────────────────────────────────
  if (action === 'upload') {
    if (!c.gclid && !c.gbraid && !c.wbraid) {
      return NextResponse.json(
        { error: 'This lead has no Google click id, so it cannot be uploaded.' },
        { status: 400 }
      );
    }
    if (c.offline_conv_status === 'uploaded') {
      return NextResponse.json({ success: true, alreadyUploaded: true });
    }

    try {
      const now = new Date();
      await uploadQualifiedLead({
        gclid: c.gclid,
        gbraid: c.gbraid,
        wbraid: c.wbraid,
        orderId: c.id,
        conversionDateTime: now,
      });

      await serviceSupabase
        .from('contacts')
        .update({
          offline_conv_status: 'uploaded',
          offline_conv_uploaded_at: now.toISOString(),
          qualified_at: now.toISOString(),
        } as Record<string, unknown>)
        .eq('id', id);

      await logAdminActivity(request, {
        action: 'contact.qualified_uploaded',
        resourceType: 'contact',
        resourceId: id,
        summary: 'uploaded a qualified-lead offline conversion to Google Ads',
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[OfflineConversion] upload failed:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Upload failed' },
        { status: 502 }
      );
    }
  }

  // ── Retract ───────────────────────────────────────────────────────────
  if (c.offline_conv_status !== 'uploaded') {
    return NextResponse.json({ success: true, nothingToRetract: true });
  }

  try {
    await retractQualifiedLead({
      orderId: c.id,
      gclid: c.gclid,
      gbraid: c.gbraid,
      wbraid: c.wbraid,
    });

    await serviceSupabase
      .from('contacts')
      .update({ offline_conv_status: 'retracted' } as Record<string, unknown>)
      .eq('id', id);

    await logAdminActivity(request, {
      action: 'contact.qualified_retracted',
      resourceType: 'contact',
      resourceId: id,
      summary: 'retracted a qualified-lead offline conversion from Google Ads',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[OfflineConversion] retract failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Retract failed' },
      { status: 502 }
    );
  }
}
