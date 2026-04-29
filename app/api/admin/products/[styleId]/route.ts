import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';

function getServiceSupabase() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

const ADMIN_NOTE_MAX_CHARS = 2000;
const HIDE_REASON_MAX_CHARS = 500;
const MIN_QTY_MAX = 1_000_000;

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'admin_note',
  'min_order_quantity',
  'variants',
  'manually_hidden',
  'manually_hidden_reason',
]);
const ALLOWED_VARIANT_KEYS = new Set(['sku', 'min_order_quantity']);

interface VariantPatch {
  sku: string;
  min_order_quantity: number | null;
}

interface PatchBody {
  admin_note?: string | null;
  min_order_quantity?: number | null;
  variants?: VariantPatch[];
  manually_hidden?: boolean;
  manually_hidden_reason?: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

/** Coerce a possibly-empty string to null and trim; return validation error if too long. */
function normalizeNullableString(
  value: unknown,
  field: string,
  maxLen: number,
): { value: string | null } | { error: ValidationError } {
  if (value === null || value === undefined) return { value: null };
  if (typeof value !== 'string') {
    return { error: { field, message: `${field} must be a string or null` } };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return { value: null };
  if (trimmed.length > maxLen) {
    return {
      error: { field, message: `${field} cannot exceed ${maxLen} characters` },
    };
  }
  return { value: trimmed };
}

/** Coerce a min-order-quantity input to an integer >= 1 or null. */
function normalizeMinQty(
  value: unknown,
  field: string,
): { value: number | null } | { error: ValidationError } {
  if (value === null || value === undefined) return { value: null };
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      error: { field, message: `${field} must be a number or null` },
    };
  }
  if (!Number.isInteger(value)) {
    return { error: { field, message: `${field} must be a whole number` } };
  }
  if (value < 1) {
    return { error: { field, message: `${field} must be at least 1` } };
  }
  if (value > MIN_QTY_MAX) {
    return {
      error: { field, message: `${field} cannot exceed ${MIN_QTY_MAX}` },
    };
  }
  return { value };
}

function stringifyForAudit(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/** Returns true when both values represent the same logical value. */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return false;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { styleId: string } },
) {
  // ---- Auth ----------------------------------------------------------------
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

  // ---- Parse + validate input ---------------------------------------------
  const styleId = parseInt(params.styleId, 10);
  if (!Number.isFinite(styleId) || styleId <= 0) {
    return NextResponse.json({ error: 'Invalid styleId' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  // Reject unknown top-level keys (defense in depth — limits future drift).
  const unknownTop = Object.keys(body).filter((k) => !ALLOWED_TOP_LEVEL_KEYS.has(k));
  if (unknownTop.length > 0) {
    return NextResponse.json(
      { error: `Unknown field(s): ${unknownTop.join(', ')}` },
      { status: 400 },
    );
  }

  const errors: ValidationError[] = [];

  // admin_note ---------------------------------------------------------------
  let nextAdminNote: string | null | undefined; // undefined = field not present in body
  if ('admin_note' in body) {
    const r = normalizeNullableString(body.admin_note, 'admin_note', ADMIN_NOTE_MAX_CHARS);
    if ('error' in r) errors.push(r.error);
    else nextAdminNote = r.value;
  }

  // style-level min_order_quantity ------------------------------------------
  let nextStyleMinQty: number | null | undefined;
  if ('min_order_quantity' in body) {
    const r = normalizeMinQty(body.min_order_quantity, 'min_order_quantity');
    if ('error' in r) errors.push(r.error);
    else nextStyleMinQty = r.value;
  }

  // manually_hidden ----------------------------------------------------------
  // Admin-controlled visibility flag. Independent of `is_active` (which the
  // sync pipeline owns). When transitioning to true we also stamp metadata
  // (timestamp, who, optional reason). When transitioning to false those
  // metadata columns are cleared.
  let nextManuallyHidden: boolean | undefined;
  if ('manually_hidden' in body) {
    if (typeof body.manually_hidden !== 'boolean') {
      errors.push({
        field: 'manually_hidden',
        message: 'manually_hidden must be a boolean',
      });
    } else {
      nextManuallyHidden = body.manually_hidden;
    }
  }

  // manually_hidden_reason — optional free-text. Only meaningful when the
  // product is being hidden; ignored on un-hide (we always clear it then).
  let nextManuallyHiddenReason: string | null | undefined;
  if ('manually_hidden_reason' in body) {
    const r = normalizeNullableString(
      body.manually_hidden_reason,
      'manually_hidden_reason',
      HIDE_REASON_MAX_CHARS,
    );
    if ('error' in r) errors.push(r.error);
    else nextManuallyHiddenReason = r.value;
  }

  // variants -----------------------------------------------------------------
  let nextVariants: VariantPatch[] | undefined;
  if ('variants' in body && body.variants !== undefined) {
    if (!Array.isArray(body.variants)) {
      errors.push({ field: 'variants', message: 'variants must be an array' });
    } else {
      const seen = new Set<string>();
      const cleaned: VariantPatch[] = [];

      body.variants.forEach((v, i) => {
        if (typeof v !== 'object' || v === null) {
          errors.push({
            field: `variants[${i}]`,
            message: 'must be an object',
          });
          return;
        }
        const unknown = Object.keys(v).filter((k) => !ALLOWED_VARIANT_KEYS.has(k));
        if (unknown.length > 0) {
          errors.push({
            field: `variants[${i}]`,
            message: `unknown field(s): ${unknown.join(', ')}`,
          });
          return;
        }
        if (typeof v.sku !== 'string' || v.sku.length === 0) {
          errors.push({ field: `variants[${i}].sku`, message: 'sku is required' });
          return;
        }
        if (seen.has(v.sku)) {
          errors.push({
            field: `variants[${i}].sku`,
            message: `duplicate sku ${v.sku}`,
          });
          return;
        }
        seen.add(v.sku);

        const minQ = normalizeMinQty(
          v.min_order_quantity,
          `variants[${i}].min_order_quantity`,
        );
        if ('error' in minQ) {
          errors.push(minQ.error);
          return;
        }
        cleaned.push({ sku: v.sku, min_order_quantity: minQ.value });
      });

      if (cleaned.length > 0) nextVariants = cleaned;
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 },
    );
  }

  const noStyleEdits =
    nextAdminNote === undefined &&
    nextStyleMinQty === undefined &&
    nextManuallyHidden === undefined &&
    nextManuallyHiddenReason === undefined;
  const noVariantEdits = !nextVariants || nextVariants.length === 0;
  if (noStyleEdits && noVariantEdits) {
    return NextResponse.json(
      { error: 'No fields to update' },
      { status: 400 },
    );
  }

  // ---- Service-role client + existence check ------------------------------
  const service = getServiceSupabase();

  const { data: existingProductRaw, error: fetchProductError } = await service
    .from('products')
    .select(
      'style_id, admin_note, min_order_quantity, manually_hidden, manually_hidden_reason',
    )
    .eq('style_id', styleId)
    .single();

  if (fetchProductError || !existingProductRaw) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const existingProduct = existingProductRaw as {
    style_id: number;
    admin_note: string | null;
    min_order_quantity: number | null;
    manually_hidden: boolean;
    manually_hidden_reason: string | null;
  };

  // ---- Validate variant SKUs belong to this style + capture old values ----
  type ExistingVariant = { sku: string; min_order_quantity: number | null };
  const existingVariantBySku = new Map<string, ExistingVariant>();

  if (nextVariants && nextVariants.length > 0) {
    const skus = nextVariants.map((v) => v.sku);
    const { data: variantRows, error: fetchVariantsError } = await service
      .from('product_skus')
      .select('sku, style_id, min_order_quantity')
      .in('sku', skus);

    if (fetchVariantsError) {
      console.error('[admin/products PATCH] variant fetch failed:', fetchVariantsError);
      return NextResponse.json({ error: 'Failed to load variants' }, { status: 500 });
    }

    const rows = (variantRows || []) as Array<{
      sku: string;
      style_id: number;
      min_order_quantity: number | null;
    }>;

    const foundSkus = new Set(rows.map((r) => r.sku));
    const missing = skus.filter((s) => !foundSkus.has(s));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown SKU(s): ${missing.join(', ')}` },
        { status: 400 },
      );
    }
    const wrongStyle = rows.filter((r) => r.style_id !== styleId).map((r) => r.sku);
    if (wrongStyle.length > 0) {
      return NextResponse.json(
        {
          error: `SKU(s) do not belong to style ${styleId}: ${wrongStyle.join(', ')}`,
        },
        { status: 400 },
      );
    }
    for (const r of rows) {
      existingVariantBySku.set(r.sku, {
        sku: r.sku,
        min_order_quantity: r.min_order_quantity,
      });
    }
  }

  // ---- Compute the actual diff (skip writes for unchanged values) --------
  const productPatch: Record<string, unknown> = {};
  const auditRows: Array<{
    style_id: number;
    sku: string | null;
    field: string;
    old_value: string | null;
    new_value: string | null;
    edited_by: string;
  }> = [];
  const changedFields: string[] = [];

  if (nextAdminNote !== undefined && !isEqual(existingProduct.admin_note, nextAdminNote)) {
    productPatch.admin_note = nextAdminNote;
    auditRows.push({
      style_id: styleId,
      sku: null,
      field: 'admin_note',
      old_value: stringifyForAudit(existingProduct.admin_note),
      new_value: stringifyForAudit(nextAdminNote),
      edited_by: user.id,
    });
    changedFields.push('admin_note');
  }

  if (
    nextStyleMinQty !== undefined &&
    !isEqual(existingProduct.min_order_quantity, nextStyleMinQty)
  ) {
    productPatch.min_order_quantity = nextStyleMinQty;
    auditRows.push({
      style_id: styleId,
      sku: null,
      field: 'min_order_quantity',
      old_value: stringifyForAudit(existingProduct.min_order_quantity),
      new_value: stringifyForAudit(nextStyleMinQty),
      edited_by: user.id,
    });
    changedFields.push('min_order_quantity');
  }

  // manually_hidden transitions ---------------------------------------------
  // Three valid shapes from the client:
  //   (a) { manually_hidden: true,  manually_hidden_reason?: '...' } — hide
  //   (b) { manually_hidden: false }                                  — un-hide
  //   (c) { manually_hidden_reason: '...' }                           — edit reason on an
  //                                                                    already-hidden product
  // We compute target values, then only emit a patch if anything changed.
  const targetHidden =
    nextManuallyHidden !== undefined
      ? nextManuallyHidden
      : existingProduct.manually_hidden;

  let targetReason: string | null;
  if (targetHidden) {
    // When hidden, accept the reason from the body if present, else keep what's there.
    targetReason =
      nextManuallyHiddenReason !== undefined
        ? nextManuallyHiddenReason
        : existingProduct.manually_hidden_reason;
  } else {
    // Un-hidden: always clear the reason regardless of what the client sent.
    targetReason = null;
  }

  const hiddenChanged = existingProduct.manually_hidden !== targetHidden;
  const reasonChanged = !isEqual(existingProduct.manually_hidden_reason, targetReason);

  if (hiddenChanged) {
    productPatch.manually_hidden = targetHidden;
    if (targetHidden) {
      // Stamp who/when on transition into hidden state.
      productPatch.manually_hidden_at = new Date().toISOString();
      productPatch.manually_hidden_by = user.id;
    } else {
      // Clear all metadata on un-hide so the row reads cleanly.
      productPatch.manually_hidden_at = null;
      productPatch.manually_hidden_by = null;
    }
    auditRows.push({
      style_id: styleId,
      sku: null,
      field: 'manually_hidden',
      old_value: stringifyForAudit(existingProduct.manually_hidden),
      new_value: stringifyForAudit(targetHidden),
      edited_by: user.id,
    });
    changedFields.push('manually_hidden');
  }

  if (reasonChanged) {
    productPatch.manually_hidden_reason = targetReason;
    // Only emit a separate audit row when the reason changed independently
    // of the hidden flag. Otherwise the manually_hidden audit row already
    // captures the operation.
    if (!hiddenChanged) {
      auditRows.push({
        style_id: styleId,
        sku: null,
        field: 'manually_hidden_reason',
        old_value: stringifyForAudit(existingProduct.manually_hidden_reason),
        new_value: stringifyForAudit(targetReason),
        edited_by: user.id,
      });
      changedFields.push('manually_hidden_reason');
    }
  }

  const variantsToWrite: VariantPatch[] = [];
  if (nextVariants) {
    for (const v of nextVariants) {
      const existing = existingVariantBySku.get(v.sku);
      if (!existing) continue; // already validated above; defensive
      if (isEqual(existing.min_order_quantity, v.min_order_quantity)) continue;
      variantsToWrite.push(v);
      auditRows.push({
        style_id: styleId,
        sku: v.sku,
        field: 'min_order_quantity',
        old_value: stringifyForAudit(existing.min_order_quantity),
        new_value: stringifyForAudit(v.min_order_quantity),
        edited_by: user.id,
      });
    }
    if (variantsToWrite.length > 0) {
      changedFields.push(`variants:${variantsToWrite.length}`);
    }
  }

  if (Object.keys(productPatch).length === 0 && variantsToWrite.length === 0) {
    return NextResponse.json({
      ok: true,
      changedFields: [],
      message: 'No changes detected',
    });
  }

  // ---- Apply writes -------------------------------------------------------
  // Note: Supabase JS client has no transaction primitive, so writes are
  // sequential. They are all idempotent — re-running the same PATCH will
  // converge to the same end state.

  if (Object.keys(productPatch).length > 0) {
    const { error } = await service
      .from('products')
      .update(productPatch)
      .eq('style_id', styleId);
    if (error) {
      console.error('[admin/products PATCH] product update failed:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  }

  if (variantsToWrite.length > 0) {
    // Update each SKU individually. Supabase doesn't support per-row UPDATE in a
    // single batch via the JS client without an RPC, and the volume is small
    // (a few dozen at most for typical edits).
    const results = await Promise.all(
      variantsToWrite.map((v) =>
        service
          .from('product_skus')
          .update({ min_order_quantity: v.min_order_quantity })
          .eq('sku', v.sku)
          .eq('style_id', styleId),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error('[admin/products PATCH] variant update failed:', failed.error);
      return NextResponse.json(
        { error: 'Failed to update one or more variants' },
        { status: 500 },
      );
    }
  }

  if (auditRows.length > 0) {
    const { error: auditError } = await service
      .from('product_admin_edits')
      .insert(auditRows);
    if (auditError) {
      // The save itself succeeded; only the audit insert failed. Log loudly
      // but don't fail the request.
      console.error(
        '[admin/products PATCH] audit insert failed (save succeeded):',
        auditError,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    changedFields,
    product: {
      style_id: styleId,
      admin_note:
        nextAdminNote !== undefined ? nextAdminNote : existingProduct.admin_note,
      min_order_quantity:
        nextStyleMinQty !== undefined
          ? nextStyleMinQty
          : existingProduct.min_order_quantity,
      manually_hidden: targetHidden,
      manually_hidden_reason: targetReason,
      manually_hidden_at:
        hiddenChanged && targetHidden
          ? (productPatch.manually_hidden_at as string)
          : hiddenChanged && !targetHidden
            ? null
            : undefined,
    },
    variants: variantsToWrite,
  });
}
