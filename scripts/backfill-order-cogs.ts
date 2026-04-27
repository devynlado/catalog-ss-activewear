/**
 * Backfill COGS and Stripe fees for historical orders.
 *
 * Usage:
 *   npx tsx scripts/backfill-order-cogs.ts
 *
 * Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

interface OrderItem {
  type: string;
  sku?: string;
  quantity?: number;
  totalQuantity?: number;
  productStyleId?: number;
}

async function main() {
  console.log('Fetching orders without COGS data...');

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, items, total, stripe_charge_id, total_cogs, stripe_fee')
    .is('total_cogs', null)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch orders:', error);
    process.exit(1);
  }

  console.log(`Found ${orders.length} orders to backfill.\n`);

  // Build a set of all SKUs we need COGS for
  const allSkus = new Set<string>();
  const allStyleIds = new Set<number>();

  for (const order of orders) {
    const items = order.items as OrderItem[];
    for (const item of items) {
      if (item.type === 'product' && item.sku) {
        allSkus.add(item.sku);
      } else if (item.type === 'package' && item.productStyleId) {
        allStyleIds.add(item.productStyleId);
      }
    }
  }

  // Batch fetch all SKU COGS
  console.log(`Looking up COGS for ${allSkus.size} SKUs and ${allStyleIds.size} style IDs...`);

  const cogsMap: Record<string, number | null> = {};

  if (allSkus.size > 0) {
    const skuArr = Array.from(allSkus);
    // Supabase .in() has a limit, batch in chunks of 500
    for (let i = 0; i < skuArr.length; i += 500) {
      const chunk = skuArr.slice(i, i + 500);
      const { data: skuCosts } = await supabase
        .from('product_skus')
        .select('sku, cogs')
        .in('sku', chunk);
      for (const s of skuCosts || []) {
        cogsMap[s.sku] = s.cogs;
      }
    }
  }

  // Fetch average COGS per style for package orders
  const styleCogsMap: Record<number, number | null> = {};
  for (const styleId of allStyleIds) {
    const { data: skuCosts } = await supabase
      .from('product_skus')
      .select('cogs')
      .eq('style_id', styleId)
      .not('cogs', 'is', null);
    if (skuCosts && skuCosts.length > 0) {
      styleCogsMap[styleId] = skuCosts.reduce((sum, s) => sum + Number(s.cogs), 0) / skuCosts.length;
    } else {
      styleCogsMap[styleId] = null;
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const items = order.items as OrderItem[];

    // Calculate total COGS
    let totalCogs = 0;
    let hasAllCogs = true;
    const updatedItems = items.map(item => {
      if (item.type === 'product' && item.sku) {
        const cogs = cogsMap[item.sku] ?? null;
        if (cogs === null) hasAllCogs = false;
        totalCogs += (cogs ?? 0) * (item.quantity ?? 0);
        return { ...item, cogs };
      } else if (item.type === 'package' && item.productStyleId) {
        const blankCogs = styleCogsMap[item.productStyleId] ?? null;
        if (blankCogs === null) hasAllCogs = false;
        totalCogs += (blankCogs ?? 0) * (item.totalQuantity ?? 0);
        return { ...item, blankCogs };
      }
      return item;
    });

    // Get exact Stripe fee from balance_transaction
    let stripeFee: number | null = null;
    if (order.stripe_charge_id && !order.stripe_fee) {
      try {
        const charge = await stripe.charges.retrieve(order.stripe_charge_id, {
          expand: ['balance_transaction'],
        });
        const bt = charge.balance_transaction;
        if (bt && typeof bt === 'object' && 'fee' in bt) {
          stripeFee = bt.fee / 100;
        }
      } catch (err) {
        // Estimate if Stripe lookup fails
        console.warn(`  Could not retrieve Stripe fee for ${order.order_number}, using estimate`);
        stripeFee = Math.round((Number(order.total) * 0.029 + 0.30) * 100) / 100;
      }
    }

    const updatePayload: Record<string, unknown> = {
      items: updatedItems,
      total_cogs: Math.round(totalCogs * 100) / 100,
      cogs_source: 'backfill',
    };

    if (stripeFee !== null) {
      updatePayload.stripe_fee = stripeFee;
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);

    if (updateErr) {
      console.error(`  FAILED ${order.order_number}:`, updateErr.message);
      skipped++;
    } else {
      const margin = totalCogs > 0
        ? ((Number(order.total) - totalCogs) / Number(order.total) * 100).toFixed(1)
        : 'N/A';
      console.log(
        `  ${order.order_number}: COGS=$${totalCogs.toFixed(2)}, ` +
        `Stripe=$${stripeFee?.toFixed(2) ?? 'N/A'}, ` +
        `Margin=${margin}%` +
        (hasAllCogs ? '' : ' (partial COGS)')
      );
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
