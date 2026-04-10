/**
 * One-time script: set 1801GD SKU prices to tier-1 base prices.
 *
 * Run with: npx tsx scripts/set-1801gd-tiered-prices.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const STYLE_ID = 9001801;
/** GMC `auto_pricing_min_price` source: product_skus.auto_min_price */
const AUTO_MIN_PRICE_USD = 26;

const TIER1_PRICES: Record<string, number> = {
  standard: 12.49,
  '2xl': 14.49,
  '3xl': 16.99,
  '4xl': 18.99,
};

function classifySize(sizeName: string): string {
  const upper = sizeName.toUpperCase().trim();
  if (upper.includes('4X') || upper.includes('5X')) return '4xl';
  if (upper.includes('3X')) return '3xl';
  if (upper.includes('2X')) return '2xl';
  return 'standard';
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch all 1801GD SKUs
  const { data: skus, error } = await supabase
    .from('product_skus')
    .select('sku, size_name, retail_price, sale_price')
    .eq('style_id', STYLE_ID);

  if (error) {
    console.error('Failed to fetch SKUs:', error.message);
    process.exit(1);
  }

  if (!skus || skus.length === 0) {
    console.log('No SKUs found for style_id', STYLE_ID);
    process.exit(0);
  }

  console.log(`Found ${skus.length} SKUs for 1801GD\n`);

  let updated = 0;
  for (const sku of skus) {
    const group = classifySize(sku.size_name);
    const newPrice = TIER1_PRICES[group];
    const oldPrice = sku.retail_price;

    if (oldPrice === newPrice) {
      console.log(`  ${sku.sku} (${sku.size_name}) — already $${newPrice}, skipping`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('product_skus')
      .update({ retail_price: newPrice, sale_price: null })
      .eq('sku', sku.sku);

    if (updateErr) {
      console.error(`  FAILED ${sku.sku}: ${updateErr.message}`);
    } else {
      console.log(`  ${sku.sku} (${sku.size_name}): $${oldPrice} → $${newPrice}`);
      updated++;
    }
  }

  // Update product-level min prices
  const minPrice = TIER1_PRICES.standard; // S-XL tier-1 price
  const { error: prodErr } = await supabase
    .from('products')
    .update({
      base_price: minPrice,
      min_retail_price: minPrice,
      min_sale_price: null,
      is_on_sale: false,
    })
    .eq('style_id', STYLE_ID);

  if (prodErr) {
    console.error(`\nFailed to update products row: ${prodErr.message}`);
  } else {
    console.log(`\nUpdated products.min_retail_price → $${minPrice}`);
  }

  const { error: autoMinErr } = await supabase
    .from('product_skus')
    .update({ auto_min_price: AUTO_MIN_PRICE_USD })
    .eq('style_id', STYLE_ID);

  if (autoMinErr) {
    console.error(`\nFailed to set auto_min_price: ${autoMinErr.message}`);
  } else {
    console.log(`\nSet auto_min_price → $${AUTO_MIN_PRICE_USD} for all style_id ${STYLE_ID} SKUs`);
  }

  console.log(`\nDone. Updated ${updated} of ${skus.length} SKUs.`);
}

main();
