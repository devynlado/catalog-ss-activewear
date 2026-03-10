import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AdSpendEntry {
  date: string;
  platform: string;
  spend: number;
  impressions?: number;
  clicks?: number;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  const expectedSecret = process.env.ADSPEND_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const entries: AdSpendEntry[] = Array.isArray(body.entries) ? body.entries : [body];

  if (entries.length === 0) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const results: { date: string; platform: string; status: string }[] = [];

  for (const entry of entries) {
    if (!entry.date || !entry.spend || entry.spend <= 0) continue;

    const { error } = await supabase
      .from('ad_spend_entries')
      .upsert(
        {
          date: entry.date,
          platform: entry.platform || 'google_pmax',
          spend: entry.spend,
          impressions: entry.impressions || null,
          clicks: entry.clicks || null,
        },
        { onConflict: 'date,platform' }
      );

    results.push({
      date: entry.date,
      platform: entry.platform || 'google_pmax',
      status: error ? 'failed' : 'ok',
    });
  }

  return NextResponse.json({ results });
}
