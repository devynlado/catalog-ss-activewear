import { NextRequest, NextResponse } from 'next/server';
import { retryFailedOrders } from '@/lib/ss-activewear-orders';

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
    const result = await retryFailedOrders();

    console.log(
      `[SS Retry Cron] Retried: ${result.retried}, Succeeded: ${result.succeeded}, Failed: ${result.failed}`
    );

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SS Retry Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
