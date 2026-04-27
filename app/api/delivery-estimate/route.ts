import { NextRequest, NextResponse } from 'next/server';
import { getDaysInTransit } from '@/lib/ss-activewear-orders';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  if (!zip || zip.length < 5) {
    return NextResponse.json(
      { error: 'Valid zip code is required' },
      { status: 400 }
    );
  }

  try {
    const estimates = await getDaysInTransit(zip);

    // Find the fastest estimate (smallest daysInTransit)
    const fastest = estimates.reduce(
      (best, e) => (!best || e.daysInTransit < best.daysInTransit ? e : best),
      null as typeof estimates[0] | null
    );

    return NextResponse.json({
      zip: zip.substring(0, 5),
      estimates,
      fastest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Delivery Estimate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery estimates' },
      { status: 500 }
    );
  }
}
