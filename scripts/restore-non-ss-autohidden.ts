/**
 * One-time recovery script.
 *
 * Background: the auto-discontinue logic (`checkDiscontinuedProducts` and the
 * discontinued-marking step in `syncFullCatalog`) compared ALL products against
 * the SS Activewear catalog only, without filtering by supplier. As a result,
 * non-SS products (LA Apparel, Otto Cap, AS Colour) were never "found" in the SS
 * catalog and got wrongly flagged (`discontinued_detected_at`) and auto-hidden
 * (`is_active = false`).
 *
 * The code has been fixed to scope those checks to `supplier = 'ss_activewear'`.
 * This script repairs the data that the bug already damaged: it restores every
 * non-SS product that was flagged and/or auto-hidden.
 *
 * What it does (per non-SS product that was flagged/hidden):
 *   - is_active = true
 *   - discontinued_detected_at = null
 *
 * What it intentionally leaves untouched:
 *   - manually_hidden / manually_hidden_* : an explicit admin hide is a separate
 *     decision from the auto-hide bug, so it must NOT be reverted here.
 *
 * Usage:
 *   Dry run (default, no writes):   npx tsx scripts/restore-non-ss-autohidden.ts
 *   Apply changes:                  npx tsx scripts/restore-non-ss-autohidden.ts --apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');

type ProductRow = {
  style_id: number;
  slug: string | null;
  style_name: string | null;
  supplier: string | null;
  is_active: boolean | null;
  discontinued_detected_at: string | null;
  manually_hidden: boolean | null;
};

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(
    APPLY
      ? '=== RESTORE non-SS auto-hidden products (APPLY mode — writing changes) ===\n'
      : '=== RESTORE non-SS auto-hidden products (DRY RUN — no writes) ===\n',
  );

  // Find every non-SS product that the buggy check touched: either it was
  // flagged (discontinued_detected_at set) or auto-hidden (is_active = false).
  const { data, error } = await supabase
    .from('products')
    .select(
      'style_id, slug, style_name, supplier, is_active, discontinued_detected_at, manually_hidden',
    )
    .neq('supplier', 'ss_activewear')
    .or('is_active.eq.false,discontinued_detected_at.not.is.null');

  if (error) {
    console.error('Failed to query products:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as ProductRow[];

  if (rows.length === 0) {
    console.log('No wrongly-hidden non-SS products found. Nothing to restore.');
    return;
  }

  // Group for a readable report.
  const bySupplier = new Map<string, ProductRow[]>();
  for (const r of rows) {
    const key = r.supplier ?? '(null)';
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(r);
  }

  console.log(`Found ${rows.length} affected non-SS product(s):\n`);
  for (const [supplier, list] of bySupplier) {
    console.log(`  supplier="${supplier}" — ${list.length} product(s)`);
    for (const r of list) {
      const flags = [
        r.is_active === false ? 'auto-hidden(is_active=false)' : null,
        r.discontinued_detected_at ? `flagged@${r.discontinued_detected_at}` : null,
        r.manually_hidden ? 'manually_hidden(kept)' : null,
      ]
        .filter(Boolean)
        .join(', ');
      console.log(
        `    - ${r.slug ?? r.style_id} (style_id=${r.style_id}) [${flags}]`,
      );
    }
    console.log('');
  }

  if (!APPLY) {
    console.log(
      'DRY RUN complete. Re-run with --apply to restore these products.',
    );
    return;
  }

  // Apply: restore is_active and clear the discontinued flag. Leave
  // manually_hidden untouched so explicit admin hides are preserved.
  let restored = 0;
  let failed = 0;
  for (const r of rows) {
    const { error: updErr } = await (supabase as any)
      .from('products')
      .update({
        is_active: true,
        discontinued_detected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('style_id', r.style_id);

    if (updErr) {
      console.error(`  FAILED style_id=${r.style_id}: ${updErr.message}`);
      failed++;
    } else {
      const note = r.manually_hidden
        ? ' (is_active restored; still manually_hidden by admin)'
        : '';
      console.log(`  Restored ${r.slug ?? r.style_id} (style_id=${r.style_id})${note}`);
      restored++;
    }
  }

  console.log(
    `\nDone. Restored ${restored} product(s)` +
      (failed ? `, ${failed} failed.` : '.'),
  );
}

main();
