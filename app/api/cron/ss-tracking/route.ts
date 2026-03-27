import { NextRequest, NextResponse } from 'next/server';
import { pollTrackingUpdates } from '@/lib/ss-activewear-orders';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const syncKey = process.env.SYNC_API_KEY;

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (syncKey && authHeader === `Bearer ${syncKey}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pollTrackingUpdates();

    console.log(
      `[SS Tracking Cron] Checked: ${result.ordersChecked}, Updated: ${result.updated}, Errors: ${result.errors}`
    );

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SS Tracking Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
