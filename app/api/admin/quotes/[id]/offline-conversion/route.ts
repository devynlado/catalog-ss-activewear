import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logAdminActivity } from '@/lib/admin-audit';
import { uploadQualifiedQuote, isGoogleAdsConfigured } from '@/lib/google-ads';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/quotes/[id]/offline-conversion
 * Body: { action: 'upload' }
 *
 * - 'upload' → report this quote to Google Ads as a qualified-quote conversion
 *              (keyed by its stored gclid/gbraid/wbraid).
 *
 * Quotes have no spam concept, so there is no retraction path (unlike contacts).
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

  if (!isGoogleAdsConfigured('quote')) {
    return NextResponse.json(
      { error: 'Google Ads quote integration is not configured on the server.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action as 'upload' | undefined;
  if (action !== 'upload') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // --- Load the quote ---
  const { data: quote, error: fetchErr } = await serviceSupabase
    .from('quotes')
    .select('id, quote_id, gclid, gbraid, wbraid, offline_conv_status')
    .eq('id', id)
    .single();

  if (fetchErr || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const q = quote as {
    id: string;
    quote_id: string | null;
    gclid: string | null;
    gbraid: string | null;
    wbraid: string | null;
    offline_conv_status: string | null;
  };

  if (!q.gclid && !q.gbraid && !q.wbraid) {
    return NextResponse.json(
      { error: 'This quote has no Google click id, so it cannot be uploaded.' },
      { status: 400 }
    );
  }
  if (q.offline_conv_status === 'uploaded') {
    return NextResponse.json({ success: true, alreadyUploaded: true });
  }

  try {
    const now = new Date();
    await uploadQualifiedQuote({
      gclid: q.gclid,
      gbraid: q.gbraid,
      wbraid: q.wbraid,
      orderId: q.id,
      conversionDateTime: now,
    });

    await serviceSupabase
      .from('quotes')
      .update({
        offline_conv_status: 'uploaded',
        offline_conv_uploaded_at: now.toISOString(),
        qualified_at: now.toISOString(),
      } as Record<string, unknown>)
      .eq('id', id);

    await logAdminActivity(request, {
      action: 'quote.qualified_uploaded',
      resourceType: 'quote',
      resourceId: q.quote_id ?? id,
      summary: 'uploaded a qualified-quote offline conversion to Google Ads',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[QuoteOfflineConversion] upload failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 502 }
    );
  }
}
