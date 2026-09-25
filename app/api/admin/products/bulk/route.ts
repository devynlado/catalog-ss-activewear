import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { logAdminActivity } from '@/lib/admin-audit';

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

const MAX_BATCH = 500;
const ADMIN_NOTE_MAX_CHARS = 2000;
const HIDE_REASON_MAX_CHARS = 500;
const MIN_QTY_MAX = 1_000_000;

const BULK_ACTIONS = [
  'hide',
  'unhide',
  'set_note',
  'set_min_qty',
  'clear_min_qty',
] as const;
type BulkAction = (typeof BULK_ACTIONS)[number];

const NOTE_MODES = ['append', 'overwrite', 'only_empty'] as const;
type NoteMode = (typeof NOTE_MODES)[number];

type ProductRow = {
  style_id: number;
  admin_note: string | null;
  min_order_quantity: number | null;
  manually_hidden: boolean;
  manually_hidden_reason: string | null;
};

type AuditField = {
  field: string;
  old: string | null;
  new: string | null;
};

type Skip = { style_id: number; reason: string };

function stringifyForAudit(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

// Run async tasks with a small concurrency cap so a 500-row batch does not open
// hundreds of simultaneous DB connections.
async function runChunked<T>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<{ error: unknown } | void>,
): Promise<unknown | null> {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const results = await Promise.all(chunk.map(fn));
    const failed = results.find((r) => r && (r as { error: unknown }).error);
    if (failed) return (failed as { error: unknown }).error;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // ---- Auth (admin only) ---------------------------------------------------
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // ---- Parse + validate ----------------------------------------------------
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action as string | undefined;
  if (!action || !BULK_ACTIONS.includes(action as BulkAction)) {
    return NextResponse.json(
      { error: `Invalid action. Allowed: ${BULK_ACTIONS.join(', ')}` },
      { status: 400 },
    );
  }
  const bulkAction = action as BulkAction;

  const rawIds = Array.isArray(body.styleIds) ? (body.styleIds as unknown[]) : null;
  if (!rawIds || rawIds.length === 0) {
    return NextResponse.json({ error: 'No products selected' }, { status: 400 });
  }
  const styleIds = Array.from(
    new Set(
      rawIds
        .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  );
  if (styleIds.length === 0) {
    return NextResponse.json({ error: 'No valid product ids' }, { status: 400 });
  }
  if (styleIds.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Too many products selected (max ${MAX_BATCH} per request)` },
      { status: 400 },
    );
  }

  // Action-specific value validation.
  let noteValue: string | null = null;
  let noteMode: NoteMode = 'append';
  let minQtyValue: number | null = null;
  let reasonProvided = false;
  let reasonValue: string | null = null;

  if (bulkAction === 'set_note') {
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length === 0) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }
    if (note.length > ADMIN_NOTE_MAX_CHARS) {
      return NextResponse.json(
        { error: `Note cannot exceed ${ADMIN_NOTE_MAX_CHARS} characters` },
        { status: 400 },
      );
    }
    noteValue = note;
    const mode = body.noteMode as string | undefined;
    if (mode && !NOTE_MODES.includes(mode as NoteMode)) {
      return NextResponse.json({ error: 'Invalid noteMode' }, { status: 400 });
    }
    noteMode = (mode as NoteMode) || 'append';
  }

  if (bulkAction === 'set_min_qty') {
    const raw = body.minQty;
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1 || raw > MIN_QTY_MAX) {
      return NextResponse.json(
        { error: `minQty must be a whole number between 1 and ${MIN_QTY_MAX}` },
        { status: 400 },
      );
    }
    minQtyValue = raw;
  }

  if (bulkAction === 'hide' && 'reason' in body) {
    reasonProvided = true;
    const r = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (r.length > HIDE_REASON_MAX_CHARS) {
      return NextResponse.json(
        { error: `Reason cannot exceed ${HIDE_REASON_MAX_CHARS} characters` },
        { status: 400 },
      );
    }
    reasonValue = r.length > 0 ? r : null;
  }

  // ---- Load current state --------------------------------------------------
  const service = getServiceSupabase();
  const { data: rows, error: fetchError } = await service
    .from('products')
    .select(
      'style_id, admin_note, min_order_quantity, manually_hidden, manually_hidden_reason',
    )
    .in('style_id', styleIds) as { data: ProductRow[] | null; error: unknown };

  if (fetchError) {
    console.error('[admin/products/bulk] fetch failed:', fetchError);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }

  const rowMap = new Map<number, ProductRow>((rows || []).map((r) => [r.style_id, r]));

  // ---- Compute per-row changes --------------------------------------------
  const nowIso = new Date().toISOString();
  const skipped: Skip[] = [];
  // Bucket rows by an identical patch so uniform actions issue a single UPDATE.
  const buckets = new Map<string, { patch: Record<string, unknown>; ids: number[] }>();
  const auditRows: Array<{
    style_id: number;
    sku: string | null;
    field: string;
    old_value: string | null;
    new_value: string | null;
    edited_by: string;
  }> = [];

  const addToBucket = (styleId: number, patch: Record<string, unknown>) => {
    const key = JSON.stringify(patch);
    const existing = buckets.get(key);
    if (existing) existing.ids.push(styleId);
    else buckets.set(key, { patch, ids: [styleId] });
  };

  const pushAudit = (styleId: number, fields: AuditField[]) => {
    for (const f of fields) {
      auditRows.push({
        style_id: styleId,
        sku: null,
        field: f.field,
        old_value: f.old,
        new_value: f.new,
        edited_by: user.id,
      });
    }
  };

  for (const id of styleIds) {
    const row = rowMap.get(id);
    if (!row) {
      skipped.push({ style_id: id, reason: 'Product not found' });
      continue;
    }

    const patch: Record<string, unknown> = {};
    const audits: AuditField[] = [];

    switch (bulkAction) {
      case 'hide': {
        const desiredReason = reasonProvided ? reasonValue : row.manually_hidden_reason;
        if (!row.manually_hidden) {
          patch.manually_hidden = true;
          patch.manually_hidden_at = nowIso;
          patch.manually_hidden_by = user.id;
          audits.push({ field: 'manually_hidden', old: 'false', new: 'true' });
        }
        if (desiredReason !== row.manually_hidden_reason) {
          patch.manually_hidden_reason = desiredReason;
          audits.push({
            field: 'manually_hidden_reason',
            old: stringifyForAudit(row.manually_hidden_reason),
            new: stringifyForAudit(desiredReason),
          });
        }
        break;
      }
      case 'unhide': {
        if (!row.manually_hidden) {
          skipped.push({ style_id: id, reason: 'Not hidden' });
          continue;
        }
        patch.manually_hidden = false;
        patch.manually_hidden_at = null;
        patch.manually_hidden_by = null;
        audits.push({ field: 'manually_hidden', old: 'true', new: 'false' });
        if (row.manually_hidden_reason !== null) {
          patch.manually_hidden_reason = null;
          audits.push({
            field: 'manually_hidden_reason',
            old: stringifyForAudit(row.manually_hidden_reason),
            new: null,
          });
        }
        break;
      }
      case 'set_note': {
        const existingNote = row.admin_note ?? '';
        let newNote: string;
        if (noteMode === 'overwrite') {
          newNote = noteValue as string;
        } else if (noteMode === 'only_empty') {
          if (existingNote.trim().length > 0) {
            skipped.push({ style_id: id, reason: 'Already has a note' });
            continue;
          }
          newNote = noteValue as string;
        } else {
          // append
          newNote = existingNote.trim().length > 0
            ? `${existingNote}\n${noteValue}`
            : (noteValue as string);
          if (newNote.length > ADMIN_NOTE_MAX_CHARS) {
            skipped.push({ style_id: id, reason: 'Resulting note too long' });
            continue;
          }
        }
        if ((row.admin_note ?? null) === newNote) {
          skipped.push({ style_id: id, reason: 'Unchanged' });
          continue;
        }
        patch.admin_note = newNote;
        audits.push({
          field: 'admin_note',
          old: stringifyForAudit(row.admin_note),
          new: newNote,
        });
        break;
      }
      case 'set_min_qty': {
        if (row.min_order_quantity === minQtyValue) {
          skipped.push({ style_id: id, reason: 'Unchanged' });
          continue;
        }
        patch.min_order_quantity = minQtyValue;
        audits.push({
          field: 'min_order_quantity',
          old: stringifyForAudit(row.min_order_quantity),
          new: stringifyForAudit(minQtyValue),
        });
        break;
      }
      case 'clear_min_qty': {
        if (row.min_order_quantity === null) {
          skipped.push({ style_id: id, reason: 'Already empty' });
          continue;
        }
        patch.min_order_quantity = null;
        audits.push({
          field: 'min_order_quantity',
          old: stringifyForAudit(row.min_order_quantity),
          new: null,
        });
        break;
      }
    }

    if (Object.keys(patch).length === 0) {
      skipped.push({ style_id: id, reason: 'Unchanged' });
      continue;
    }

    addToBucket(id, patch);
    pushAudit(id, audits);
  }

  const updatedIds: number[] = [];
  for (const { ids } of buckets.values()) updatedIds.push(...ids);

  // ---- Apply writes --------------------------------------------------------
  if (buckets.size > 0) {
    const bucketList = Array.from(buckets.values());
    const writeError = await runChunked(bucketList, 10, async ({ patch, ids }) => {
      const { error } = await service
        .from('products')
        .update(patch)
        .in('style_id', ids);
      return { error };
    });
    if (writeError) {
      console.error('[admin/products/bulk] update failed:', writeError);
      return NextResponse.json({ error: 'Failed to update products' }, { status: 500 });
    }

    // Audit trail (best-effort — the save already succeeded).
    if (auditRows.length > 0) {
      const insertError = await runChunked(
        // chunk audit inserts to keep payloads reasonable
        Array.from({ length: Math.ceil(auditRows.length / 500) }, (_, i) =>
          auditRows.slice(i * 500, i * 500 + 500),
        ),
        2,
        async (chunk) => {
          const { error } = await service.from('product_admin_edits').insert(chunk);
          return { error };
        },
      );
      if (insertError) {
        console.error(
          '[admin/products/bulk] audit insert failed (save succeeded):',
          insertError,
        );
      }
    }

    // Single summary entry in the admin activity log (avoids burst alerts).
    const actor = {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role as 'admin' | 'sales_rep',
    };
    const ACTION_SUMMARY: Record<BulkAction, string> = {
      hide: `bulk hid ${updatedIds.length} product(s) from the catalog`,
      unhide: `bulk restored ${updatedIds.length} product(s) to the catalog`,
      set_note: `bulk updated the admin note on ${updatedIds.length} product(s)`,
      set_min_qty: `bulk set the minimum order quantity on ${updatedIds.length} product(s)`,
      clear_min_qty: `bulk cleared the minimum order quantity on ${updatedIds.length} product(s)`,
    };
    const ACTION_KEY: Record<BulkAction, string> = {
      hide: 'product.bulk_hidden',
      unhide: 'product.bulk_unhidden',
      set_note: 'product.bulk_note_updated',
      set_min_qty: 'product.bulk_min_qty_updated',
      clear_min_qty: 'product.bulk_min_qty_cleared',
    };
    await logAdminActivity(request, {
      action: ACTION_KEY[bulkAction],
      resourceType: 'product',
      resourceId: null,
      summary: ACTION_SUMMARY[bulkAction],
      actor,
    });
  }

  return NextResponse.json({
    summary: { updated: updatedIds.length, skipped: skipped.length },
    updatedIds,
    skipped,
  });
}
