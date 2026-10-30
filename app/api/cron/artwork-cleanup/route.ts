import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ARTWORK_RETENTION_DAYS } from '@/lib/artwork';
import {
  listArtworkPathsOlderThan,
  removeArtworkObjects,
} from '@/lib/artwork-server';

/**
 * Weekly artwork retention / cleanup cron.
 *
 * WHAT IT DOES
 * ------------
 * Deletes customer-artwork files from the private `quote-artwork` bucket once
 * they are older than `ARTWORK_RETENTION_DAYS` (200 days) — EXCEPT any file
 * still attached to a quote that converted into an order
 * (`quotes.status = 'converted'`), which is kept indefinitely.
 *
 * The file bytes are removed from storage, but the path strings stay in the DB
 * (`contacts.artwork_paths`, `quotes.artwork_paths`, `quotes.items[].artworkPath`).
 * The admin dashboard detects the now-missing file (via its date-prefixed path)
 * and shows an "Arsip kedaluwarsa" label instead of a broken download.
 *
 * SCHEDULE: Sundays only (see vercel.json) to avoid piling onto the daily crons.
 *
 * SAFETY
 * ------
 * - Only descends into day-folders older than the cutoff; recent files are never
 *   listed or touched.
 * - Supports a dry run: `GET /api/cron/artwork-cleanup?dryRun=true` reports what
 *   *would* be deleted without removing anything. Use this for the first run.
 * - Always logs counts + errors so a silent failure can't rot into a hard bug.
 */

export const maxDuration = 60;

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${cronSecret}`) return true;
  }

  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.SYNC_API_KEY;
  if (expectedKey && apiKey === expectedKey) return true;

  console.error(
    '[Artwork Cleanup] Auth failed — neither CRON_SECRET nor SYNC_API_KEY matched',
  );
  return false;
}

/**
 * Collect every artwork path that must be preserved: anything attached to a
 * converted quote (i.e. a quote that became an order). Pulls both the
 * aggregated `artwork_paths` column and the per-project `items[].artworkPath`.
 */
async function getProtectedPaths(
  supabase: ReturnType<typeof getServiceSupabase>,
): Promise<Set<string>> {
  const protectedPaths = new Set<string>();

  const { data, error } = await supabase
    .from('quotes')
    .select('artwork_paths, items')
    .eq('status', 'converted');

  if (error) {
    // Fail safe: if we can't read the exceptions, we must NOT delete anything.
    throw new Error(`Failed to load converted quotes: ${error.message}`);
  }

  for (const row of data || []) {
    const paths = (row as { artwork_paths?: unknown }).artwork_paths;
    if (Array.isArray(paths)) {
      for (const p of paths) {
        if (typeof p === 'string' && p.length > 0) protectedPaths.add(p);
      }
    }

    const items = (row as { items?: unknown }).items;
    if (Array.isArray(items)) {
      for (const item of items) {
        const p = (item as { artworkPath?: unknown })?.artworkPath;
        if (typeof p === 'string' && p.length > 0) protectedPaths.add(p);
      }
    }
  }

  return protectedPaths;
}

async function handleCleanup(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun =
    new URL(request.url).searchParams.get('dryRun') === 'true';

  try {
    const supabase = getServiceSupabase();

    const cutoff = new Date(
      Date.now() - ARTWORK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    // 1) Candidate files: everything older than the retention cutoff.
    const oldPaths = await listArtworkPathsOlderThan(cutoff);

    // 2) Exceptions: never delete artwork attached to a converted quote.
    const protectedPaths = await getProtectedPaths(supabase);

    const toDelete = oldPaths.filter((p) => !protectedPaths.has(p));
    const keptByException = oldPaths.length - toDelete.length;

    console.log(
      `[Artwork Cleanup] cutoff=${cutoff.toISOString()} scanned=${oldPaths.length} ` +
        `protected=${protectedPaths.size} keptByException=${keptByException} ` +
        `toDelete=${toDelete.length} dryRun=${dryRun}`,
    );

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        cutoff: cutoff.toISOString(),
        retentionDays: ARTWORK_RETENTION_DAYS,
        scannedOldFiles: oldPaths.length,
        protectedConvertedPaths: protectedPaths.size,
        keptByException,
        wouldDelete: toDelete.length,
        sample: toDelete.slice(0, 20),
      });
    }

    const { removed, errors } = await removeArtworkObjects(toDelete);

    if (errors.length > 0) {
      console.error(
        `[Artwork Cleanup] Completed with ${errors.length} batch error(s):`,
        errors,
      );
    }
    console.log(
      `[Artwork Cleanup] Complete: removed=${removed} errors=${errors.length}`,
    );

    return NextResponse.json({
      dryRun: false,
      cutoff: cutoff.toISOString(),
      retentionDays: ARTWORK_RETENTION_DAYS,
      scannedOldFiles: oldPaths.length,
      protectedConvertedPaths: protectedPaths.size,
      keptByException,
      deleted: removed,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Artwork Cleanup] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
