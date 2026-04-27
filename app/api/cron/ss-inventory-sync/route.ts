import { NextRequest, NextResponse } from 'next/server';
import { syncInventoryOnly, getActiveProductCount, checkDiscontinuedProducts } from '@/lib/product-sync';
import { createServerSupabaseClient } from '@/lib/supabase';

export const maxDuration = 300; // Vercel Pro: 5 minutes

const CHUNK_SIZE = 400;

/**
 * GET /api/cron/ss-inventory-sync
 *
 * Called every 15 minutes by Vercel cron. Processes one chunk of ~400 products
 * per invocation. The offset is tracked in `sync_inventory_checkpoint` so each
 * run picks up where the last one left off. A full cycle through ~5,000
 * products completes in roughly 2 hours.
 */
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
    const supabase = createServerSupabaseClient();
    const totalProducts = await getActiveProductCount();

    // Read current checkpoint offset
    const { data: checkpoint } = await supabase
      .from('sync_inventory_checkpoint' as any)
      .select('current_offset')
      .eq('id', 1)
      .single() as { data: { current_offset: number } | null };

    let offset = checkpoint?.current_offset ?? 0;

    // If offset exceeds total, reset to 0 (start new cycle)
    if (offset >= totalProducts) {
      offset = 0;
    }

    console.log(
      `[Inventory Cron] Processing chunk: offset=${offset}, limit=${CHUNK_SIZE}, total=${totalProducts}`
    );

    const result = await syncInventoryOnly(offset, CHUNK_SIZE);

    // Advance checkpoint
    const nextOffset = offset + CHUNK_SIZE;
    const cycleComplete = nextOffset >= totalProducts;

    await (supabase.from as any)('sync_inventory_checkpoint').upsert({
      id: 1,
      current_offset: cycleComplete ? 0 : nextOffset,
      last_run_at: new Date().toISOString(),
      last_chunk_products: result.productsProcessed,
      last_chunk_skus: result.skusProcessed,
      cycle_complete: cycleComplete,
    });

    console.log(
      `[Inventory Cron] Done: ${result.productsProcessed} products, ${result.skusProcessed} SKUs in ${Math.round(result.duration / 1000)}s` +
      (cycleComplete ? ' — CYCLE COMPLETE, will restart next run' : ` — next offset: ${nextOffset}`)
    );

    // Run discontinued product check once per full cycle
    let discontinuedResult = null;
    if (cycleComplete) {
      console.log('[Inventory Cron] Cycle complete — running discontinued product check...');
      discontinuedResult = await checkDiscontinuedProducts();
    }

    return NextResponse.json({
      success: result.success,
      offset,
      nextOffset: cycleComplete ? 0 : nextOffset,
      cycleComplete,
      totalProducts,
      productsProcessed: result.productsProcessed,
      skusProcessed: result.skusProcessed,
      duration: `${Math.round(result.duration / 1000)}s`,
      errors: result.errors.length > 0 ? result.errors : undefined,
      discontinued: discontinuedResult ?? undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Inventory Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
