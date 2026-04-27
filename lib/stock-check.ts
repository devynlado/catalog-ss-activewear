/**
 * Real-time stock validation against SS Activewear API.
 * Used at checkout to catch items that went OOS between the last
 * inventory sync and the moment of purchase.
 */

import { getInventory } from './ss-activewear';
import { createServerSupabaseClient } from './supabase';

export interface StockCheckItem {
  sku: string;
  styleId: number;
  colorName: string;
  colorCode: string;
  sizeName: string;
  quantity: number;
}

export interface StockCheckFailure {
  sku: string;
  styleId: number;
  colorName: string;
  sizeName: string;
  requestedQty: number;
  liveQty: number;
}

export interface StockCheckResult {
  passed: boolean;
  failures: StockCheckFailure[];
}

/**
 * Check live SS Activewear inventory for all items in the cart.
 * Groups items by styleId to minimize API calls (one per style).
 */
export async function checkLiveStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  const byStyle = new Map<number, StockCheckItem[]>();
  for (const item of items) {
    if (!byStyle.has(item.styleId)) {
      byStyle.set(item.styleId, []);
    }
    byStyle.get(item.styleId)!.push(item);
  }

  const failures: StockCheckFailure[] = [];

  const checks = Array.from(byStyle.entries()).map(async ([styleId, styleItems]) => {
    try {
      const liveSkus = await getInventory(styleId);

      const liveQtyBySku = new Map<string, number>();
      for (const sku of liveSkus) {
        liveQtyBySku.set(sku.sku, sku.qty ?? 0);
      }

      for (const item of styleItems) {
        const liveQty = liveQtyBySku.get(item.sku) ?? 0;
        if (liveQty < item.quantity) {
          failures.push({
            sku: item.sku,
            styleId: item.styleId,
            colorName: item.colorName,
            sizeName: item.sizeName,
            requestedQty: item.quantity,
            liveQty,
          });
        }
      }
    } catch (err) {
      console.error(`[StockCheck] Failed to fetch live inventory for style ${styleId}:`, err);
      // On API error, allow the order through — better to attempt than to block
    }
  });

  await Promise.all(checks);

  return { passed: failures.length === 0, failures };
}

/**
 * Log stock check failures to the database for analytics.
 */
export async function logStockCheckFailures(
  failures: StockCheckFailure[],
  customerEmail?: string,
): Promise<void> {
  if (failures.length === 0) return;

  try {
    const supabase = createServerSupabaseClient();
    await (supabase.from as any)('stock_check_failures').insert(
      failures.map((f) => ({
        sku: f.sku,
        style_id: f.styleId,
        color_name: f.colorName,
        size_name: f.sizeName,
        requested_qty: f.requestedQty,
        live_qty: f.liveQty,
        customer_email: customerEmail,
      }))
    );
  } catch (err) {
    console.error('[StockCheck] Failed to log failures:', err);
  }
}
