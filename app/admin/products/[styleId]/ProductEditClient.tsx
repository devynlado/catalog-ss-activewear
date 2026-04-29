'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  StickyNote,
  Hash,
  Layers,
  Copy,
  RotateCcw,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Ban,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductEditInitialData } from './types';

interface Props {
  initialData: ProductEditInitialData;
}

const ADMIN_NOTE_MAX_CHARS = 2000;
const HIDE_REASON_MAX_CHARS = 500;

function formatHiddenSince(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------- helpers ---------------------------------------------------------

/** Parse a quantity input. Empty = null (inherit). Non-positive integers = error. */
function parseQty(input: string): { value: number | null; error?: string } {
  const trimmed = input.trim();
  if (trimmed === '') return { value: null };
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: 'Whole number only' };
  }
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) {
    return { value: null, error: 'Must be at least 1' };
  }
  if (n > 1_000_000) {
    return { value: null, error: 'Too large' };
  }
  return { value: n };
}

function qtyToInputValue(n: number | null): string {
  return n == null ? '' : String(n);
}

// ---------- main component --------------------------------------------------

export function ProductEditClient({ initialData }: Props) {
  const router = useRouter();
  const { product, variants } = initialData;

  // Form state — strings everywhere so empty input is unambiguously "no value".
  const [adminNote, setAdminNote] = useState<string>(product.admin_note ?? '');
  const [styleMinQtyInput, setStyleMinQtyInput] = useState<string>(
    qtyToInputValue(product.min_order_quantity),
  );
  // Map<sku, inputString>
  const [variantInputs, setVariantInputs] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const color of variants) {
        for (const v of color.skus) {
          map[v.sku] = qtyToInputValue(v.min_order_quantity);
        }
      }
      return map;
    },
  );

  const [showOverridesOnly, setShowOverridesOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Visibility (manually_hidden) — managed independently of the dirty-diff
  // save bar. Hide/un-hide saves immediately so the destructive action is
  // unambiguous and doesn't get bundled with note/min-qty edits.
  const [manuallyHidden, setManuallyHidden] = useState<boolean>(
    product.manually_hidden,
  );
  const [manuallyHiddenAt, setManuallyHiddenAt] = useState<string | null>(
    product.manually_hidden_at,
  );
  const [manuallyHiddenByEmail, setManuallyHiddenByEmail] = useState<string | null>(
    product.manually_hidden_by_email,
  );
  const [manuallyHiddenReason, setManuallyHiddenReason] = useState<string | null>(
    product.manually_hidden_reason,
  );
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [hideModalReason, setHideModalReason] = useState('');
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [visibilityFlash, setVisibilityFlash] = useState<string | null>(null);

  // Initial snapshot — source of truth for diff. We mutate it on successful
  // save so subsequent edits diff against the freshly-saved values.
  const [initialAdminNote, setInitialAdminNote] = useState<string | null>(
    product.admin_note,
  );
  const [initialStyleMinQty, setInitialStyleMinQty] = useState<number | null>(
    product.min_order_quantity,
  );
  const [initialVariantQty, setInitialVariantQty] = useState<
    Record<string, number | null>
  >(() => {
    const map: Record<string, number | null> = {};
    for (const color of variants) {
      for (const v of color.skus) {
        map[v.sku] = v.min_order_quantity;
      }
    }
    return map;
  });

  // ---------- validation -----------------------------------------------------
  const styleMinQtyParsed = parseQty(styleMinQtyInput);
  const styleMinQtyError = styleMinQtyParsed.error;

  const variantParsed = useMemo(() => {
    const out: Record<string, { value: number | null; error?: string }> = {};
    for (const sku of Object.keys(variantInputs)) {
      out[sku] = parseQty(variantInputs[sku]);
    }
    return out;
  }, [variantInputs]);

  const variantErrors = useMemo(() => {
    const e: Record<string, string> = {};
    for (const [sku, p] of Object.entries(variantParsed)) {
      if (p.error) e[sku] = p.error;
    }
    return e;
  }, [variantParsed]);

  const adminNoteError = useMemo(() => {
    if (adminNote.length > ADMIN_NOTE_MAX_CHARS) {
      return `Note cannot exceed ${ADMIN_NOTE_MAX_CHARS} characters (currently ${adminNote.length}).`;
    }
    return null;
  }, [adminNote]);

  const hasErrors =
    !!styleMinQtyError ||
    !!adminNoteError ||
    Object.keys(variantErrors).length > 0;

  // ---------- diff -----------------------------------------------------------
  const normalizedAdminNote = adminNote.trim() === '' ? null : adminNote.trim();
  const adminNoteChanged = normalizedAdminNote !== initialAdminNote;

  const styleMinChanged =
    !styleMinQtyError && styleMinQtyParsed.value !== initialStyleMinQty;

  const changedVariantSkus = useMemo(() => {
    const list: string[] = [];
    for (const sku of Object.keys(variantParsed)) {
      const p = variantParsed[sku];
      if (p.error) continue;
      if (p.value !== initialVariantQty[sku]) list.push(sku);
    }
    return list;
  }, [variantParsed, initialVariantQty]);

  const hasChanges =
    adminNoteChanged || styleMinChanged || changedVariantSkus.length > 0;

  const totalVariants = variants.reduce((acc, c) => acc + c.skus.length, 0);
  const variantOverrideCount = useMemo(() => {
    let n = 0;
    for (const sku of Object.keys(variantParsed)) {
      const p = variantParsed[sku];
      if (p.error) continue;
      if (p.value != null) n++;
    }
    return n;
  }, [variantParsed]);

  // ---------- handlers -------------------------------------------------------
  const handleVariantChange = useCallback((sku: string, value: string) => {
    setVariantInputs((prev) => ({ ...prev, [sku]: value }));
    setSaveSuccess(false);
  }, []);

  const handleResetVariant = useCallback((sku: string) => {
    setVariantInputs((prev) => ({ ...prev, [sku]: '' }));
    setSaveSuccess(false);
  }, []);

  const handleApplyDefaultToAll = useCallback(() => {
    if (styleMinQtyParsed.error || styleMinQtyParsed.value == null) return;
    const value = String(styleMinQtyParsed.value);
    setVariantInputs((prev) => {
      const next: Record<string, string> = {};
      for (const sku of Object.keys(prev)) next[sku] = value;
      return next;
    });
    setSaveSuccess(false);
  }, [styleMinQtyParsed]);

  const handleClearAllOverrides = useCallback(() => {
    setVariantInputs((prev) => {
      const next: Record<string, string> = {};
      for (const sku of Object.keys(prev)) next[sku] = '';
      return next;
    });
    setSaveSuccess(false);
  }, []);

  const handleDiscard = useCallback(() => {
    setAdminNote(initialAdminNote ?? '');
    setStyleMinQtyInput(qtyToInputValue(initialStyleMinQty));
    setVariantInputs(() => {
      const map: Record<string, string> = {};
      for (const color of variants) {
        for (const v of color.skus) {
          map[v.sku] = qtyToInputValue(initialVariantQty[v.sku] ?? null);
        }
      }
      return map;
    });
    setSaveError(null);
    setSaveSuccess(false);
  }, [initialAdminNote, initialStyleMinQty, initialVariantQty, variants]);

  const handleSave = useCallback(async () => {
    if (hasErrors || !hasChanges || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const body: {
      admin_note?: string | null;
      min_order_quantity?: number | null;
      variants?: Array<{ sku: string; min_order_quantity: number | null }>;
    } = {};

    if (adminNoteChanged) {
      body.admin_note = normalizedAdminNote;
    }
    if (styleMinChanged) {
      body.min_order_quantity = styleMinQtyParsed.value;
    }
    if (changedVariantSkus.length > 0) {
      body.variants = changedVariantSkus.map((sku) => ({
        sku,
        min_order_quantity: variantParsed[sku].value,
      }));
    }

    try {
      const res = await fetch(`/api/admin/products/${product.style_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: Array<{ field: string; message: string }>;
      };
      if (!res.ok) {
        const detail = data.details?.[0]?.message;
        throw new Error(detail || data.error || `Save failed (${res.status})`);
      }

      // Update initial snapshot so subsequent edits diff against fresh values.
      if (adminNoteChanged) setInitialAdminNote(normalizedAdminNote);
      if (styleMinChanged) setInitialStyleMinQty(styleMinQtyParsed.value);
      if (changedVariantSkus.length > 0) {
        setInitialVariantQty((prev) => {
          const next = { ...prev };
          for (const sku of changedVariantSkus) {
            next[sku] = variantParsed[sku].value;
          }
          return next;
        });
      }
      setSaveSuccess(true);
      // Refresh server data in the background so the search page badges
      // reflect the new state when the user returns.
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [
    hasErrors,
    hasChanges,
    isSaving,
    adminNoteChanged,
    styleMinChanged,
    changedVariantSkus,
    normalizedAdminNote,
    styleMinQtyParsed,
    variantParsed,
    product.style_id,
    router,
  ]);

  // ---- visibility handlers -------------------------------------------------
  // Hide/un-hide save through the same PATCH endpoint but as a discrete write.
  // We accept an optional reason on hide and always clear the reason on un-hide
  // (the API enforces this anyway, but mirroring it here keeps local state honest).
  const submitVisibility = useCallback(
    async (nextHidden: boolean, reason: string | null) => {
      setVisibilityBusy(true);
      setVisibilityError(null);
      setVisibilityFlash(null);

      const trimmedReason =
        reason == null ? null : reason.trim().length === 0 ? null : reason.trim();

      const body: Record<string, unknown> = {
        manually_hidden: nextHidden,
      };
      if (nextHidden) {
        // Only send a reason on hide. On un-hide the server clears it regardless.
        body.manually_hidden_reason = trimmedReason;
      }

      try {
        const res = await fetch(`/api/admin/products/${product.style_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: Array<{ field: string; message: string }>;
          product?: {
            manually_hidden?: boolean;
            manually_hidden_reason?: string | null;
            manually_hidden_at?: string | null;
          };
        };
        if (!res.ok) {
          const detail = data.details?.[0]?.message;
          throw new Error(
            detail || data.error || `Save failed (${res.status})`,
          );
        }

        const returned = data.product || {};
        setManuallyHidden(!!returned.manually_hidden);
        setManuallyHiddenReason(
          returned.manually_hidden_reason !== undefined
            ? returned.manually_hidden_reason
            : trimmedReason,
        );
        if (nextHidden) {
          setManuallyHiddenAt(
            returned.manually_hidden_at ?? new Date().toISOString(),
          );
          // We don't have the email of the current admin client-side; the next
          // server refresh will populate it. Show "you" as a friendly placeholder
          // until the refresh lands.
          setManuallyHiddenByEmail((prev) => prev ?? 'you');
        } else {
          setManuallyHiddenAt(null);
          setManuallyHiddenByEmail(null);
        }

        setVisibilityFlash(
          nextHidden ? 'Hidden from customers.' : 'Visible to customers again.',
        );
        router.refresh();
      } catch (err) {
        setVisibilityError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setVisibilityBusy(false);
      }
    },
    [product.style_id, router],
  );

  const handleConfirmHide = useCallback(async () => {
    await submitVisibility(true, hideModalReason || null);
    setHideModalOpen(false);
    setHideModalReason('');
  }, [submitVisibility, hideModalReason]);

  const handleUnhide = useCallback(async () => {
    await submitVisibility(false, null);
  }, [submitVisibility]);

  // Auto-dismiss the visibility success flash after a short delay so it doesn't
  // linger forever next to the card.
  useEffect(() => {
    if (!visibilityFlash) return;
    const t = setTimeout(() => setVisibilityFlash(null), 4000);
    return () => clearTimeout(t);
  }, [visibilityFlash]);

  // ---------- render --------------------------------------------------------
  return (
    <div className="space-y-6">
      <VisibilityCard
        manuallyHidden={manuallyHidden}
        manuallyHiddenAt={manuallyHiddenAt}
        manuallyHiddenByEmail={manuallyHiddenByEmail}
        manuallyHiddenReason={manuallyHiddenReason}
        isActive={product.is_active}
        discontinuedDetectedAt={product.discontinued_detected_at}
        busy={visibilityBusy}
        error={visibilityError}
        flash={visibilityFlash}
        onRequestHide={() => {
          setVisibilityError(null);
          setHideModalReason('');
          setHideModalOpen(true);
        }}
        onUnhide={handleUnhide}
      />

      {hideModalOpen && (
        <HideConfirmModal
          reason={hideModalReason}
          setReason={setHideModalReason}
          busy={visibilityBusy}
          onCancel={() => {
            if (visibilityBusy) return;
            setHideModalOpen(false);
            setHideModalReason('');
          }}
          onConfirm={handleConfirmHide}
        />
      )}

      <SaveBar
        hasChanges={hasChanges}
        hasErrors={hasErrors}
        isSaving={isSaving}
        saveError={saveError}
        saveSuccess={saveSuccess && !hasChanges}
        changeSummary={{
          adminNoteChanged,
          styleMinChanged,
          variantCount: changedVariantSkus.length,
        }}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* Admin note card */}
        <Card
          icon={StickyNote}
          title="Customer-visible note"
          description="Plain text shown above the fold on this product's page only. Leave empty to remove."
        >
          <textarea
            value={adminNote}
            onChange={(e) => {
              setAdminNote(e.target.value);
              setSaveSuccess(false);
            }}
            rows={4}
            placeholder='e.g. "Shipping for this product may be delayed up to 2 days."'
            className={cn(
              'w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2',
              adminNoteError
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-stone-300 focus:border-brand-400 focus:ring-brand-100',
            )}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className={cn(adminNoteError ? 'text-red-600' : 'text-slate-500')}>
              {adminNoteError ?? 'URLs in the note are auto-linked.'}
            </span>
            <span
              className={cn(
                'tabular-nums',
                adminNote.length > ADMIN_NOTE_MAX_CHARS
                  ? 'text-red-600'
                  : 'text-slate-400',
              )}
            >
              {adminNote.length} / {ADMIN_NOTE_MAX_CHARS}
            </span>
          </div>
        </Card>

        {/* Style-level minimum order quantity */}
        <Card
          icon={Hash}
          title="Default minimum order quantity"
          description="Applies to any variant that has no override below. Leave empty for no minimum."
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-none">
              <label
                htmlFor="style-min-qty"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Default for all variants
              </label>
              <input
                id="style-min-qty"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={styleMinQtyInput}
                onChange={(e) => {
                  setStyleMinQtyInput(e.target.value);
                  setSaveSuccess(false);
                }}
                placeholder="—"
                className={cn(
                  'w-32 rounded-lg border bg-white px-3 py-2 text-sm tabular-nums text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2',
                  styleMinQtyError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-300 focus:border-brand-400 focus:ring-brand-100',
                )}
              />
              {styleMinQtyError && (
                <p className="mt-1 text-xs text-red-600">{styleMinQtyError}</p>
              )}
            </div>
            <button
              type="button"
              disabled={
                !!styleMinQtyError ||
                styleMinQtyParsed.value == null
              }
              onClick={handleApplyDefaultToAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Copy the default into every variant below as an explicit value"
            >
              <Copy className="h-3.5 w-3.5" />
              Apply to all {totalVariants} variants
            </button>
            {variantOverrideCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllOverrides}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear all variant overrides
              </button>
            )}
          </div>
          <p className="mt-3 flex items-start gap-1.5 rounded-md bg-stone-50 px-3 py-2 text-xs text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
            <span>
              Validation is per variant. Each cart line must meet its applicable
              minimum (variant override if set, otherwise this default).
            </span>
          </p>
        </Card>

        {/* Variants */}
        <Card
          icon={Layers}
          title={`Variant minimums${
            variantOverrideCount > 0
              ? ` (${variantOverrideCount} of ${totalVariants} overridden)`
              : ''
          }`}
          description="Set per-color, per-size minimums where they differ from the default."
          rightSlot={
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showOverridesOnly}
                onChange={(e) => setShowOverridesOnly(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand-500 focus:ring-brand-200"
              />
              Show only variants with overrides
            </label>
          }
        >
          <VariantsGrid
            variants={variants}
            inputs={variantInputs}
            errors={variantErrors}
            initialQty={initialVariantQty}
            showOverridesOnly={showOverridesOnly}
            onChange={handleVariantChange}
            onReset={handleResetVariant}
          />
        </Card>
    </div>
  );
}

// ---------- subcomponents --------------------------------------------------

function Card({
  icon: Icon,
  title,
  description,
  rightSlot,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-stone-100 px-5 py-4">
        <div className="rounded-md bg-brand-50 p-2 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-navy-800">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {rightSlot && <div className="flex-none pt-0.5">{rightSlot}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function VariantsGrid({
  variants,
  inputs,
  errors,
  initialQty,
  showOverridesOnly,
  onChange,
  onReset,
}: {
  variants: ProductEditInitialData['variants'];
  inputs: Record<string, string>;
  errors: Record<string, string>;
  initialQty: Record<string, number | null>;
  showOverridesOnly: boolean;
  onChange: (sku: string, value: string) => void;
  onReset: (sku: string) => void;
}) {
  if (variants.length === 0) {
    return (
      <p className="text-sm text-slate-500">No variants found for this product.</p>
    );
  }

  // Filter for "show only overrides" mode based on current input state.
  const filteredColors = showOverridesOnly
    ? variants
        .map((color) => ({
          ...color,
          skus: color.skus.filter((v) => (inputs[v.sku] ?? '').trim() !== ''),
        }))
        .filter((color) => color.skus.length > 0)
    : variants;

  if (filteredColors.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No variants currently have an override. Toggle off &ldquo;Show only
        variants with overrides&rdquo; to see all variants.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {filteredColors.map((color) => {
        const overrideCount = color.skus.filter(
          (v) => (inputs[v.sku] ?? '').trim() !== '',
        ).length;
        return (
          <div
            key={color.color_code}
            className="rounded-lg border border-stone-200 bg-stone-50/40 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-700">
                {color.color_name}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {color.color_code}
                </span>
              </h3>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {overrideCount > 0
                  ? `${overrideCount} / ${color.skus.length} overridden`
                  : `${color.skus.length} sizes`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {color.skus.map((v) => {
                const input = inputs[v.sku] ?? '';
                const err = errors[v.sku];
                const hasOverride = input.trim() !== '';
                const isDirty =
                  parseQty(input).value !== initialQty[v.sku] && !err;
                return (
                  <div
                    key={v.sku}
                    className={cn(
                      'flex items-center gap-1 rounded-md border bg-white px-2 py-1.5 transition-colors',
                      err
                        ? 'border-red-300'
                        : isDirty
                          ? 'border-brand-300'
                          : 'border-stone-200',
                    )}
                  >
                    <span className="text-xs font-medium text-slate-600">
                      {v.size_name}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={input}
                      onChange={(e) => onChange(v.sku, e.target.value)}
                      placeholder="—"
                      className={cn(
                        'w-14 rounded border bg-white px-1.5 py-0.5 text-xs tabular-nums text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2',
                        err
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100',
                      )}
                      title={err || `SKU ${v.sku}`}
                    />
                    {hasOverride && (
                      <button
                        type="button"
                        onClick={() => onReset(v.sku)}
                        className="rounded text-slate-300 hover:text-red-500"
                        title="Reset to default"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SaveBar({
  hasChanges,
  hasErrors,
  isSaving,
  saveError,
  saveSuccess,
  changeSummary,
  onSave,
  onDiscard,
}: {
  hasChanges: boolean;
  hasErrors: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  changeSummary: {
    adminNoteChanged: boolean;
    styleMinChanged: boolean;
    variantCount: number;
  };
  onSave: () => void;
  onDiscard: () => void;
}) {
  const summaryParts: string[] = [];
  if (changeSummary.adminNoteChanged) summaryParts.push('note');
  if (changeSummary.styleMinChanged) summaryParts.push('default min');
  if (changeSummary.variantCount > 0) {
    summaryParts.push(
      `${changeSummary.variantCount} ${
        changeSummary.variantCount === 1 ? 'variant' : 'variants'
      }`,
    );
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : null;

  // Visual treatment shifts based on state so the bar reads at a glance:
  //   error   → red ring
  //   success → green ring
  //   dirty   → brand ring
  //   idle    → neutral
  const ringClasses = hasErrors || saveError
    ? 'border-red-200 bg-red-50/40'
    : saveSuccess
      ? 'border-green-200 bg-green-50/40'
      : hasChanges
        ? 'border-brand-200 bg-brand-50/30'
        : 'border-stone-200 bg-white';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors sm:px-5',
        ringClasses,
      )}
    >
      <div className="min-w-0 flex-1 text-sm">
          {hasErrors ? (
            <span className="inline-flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Fix the highlighted fields before saving.
            </span>
          ) : saveError ? (
            <span className="inline-flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </span>
          ) : saveSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Saved.
            </span>
          ) : hasChanges ? (
            <span className="text-slate-700">
              Unsaved changes
              {summary ? <span className="text-slate-500"> — {summary}</span> : null}
            </span>
          ) : (
            <span className="text-slate-400">No changes</span>
          )}
        </div>

        <button
          type="button"
          onClick={onDiscard}
          disabled={!hasChanges || isSaving}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!hasChanges || hasErrors || isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
    </div>
  );
}

// ---------- Visibility (manually_hidden) ----------------------------------

function VisibilityCard({
  manuallyHidden,
  manuallyHiddenAt,
  manuallyHiddenByEmail,
  manuallyHiddenReason,
  isActive,
  discontinuedDetectedAt,
  busy,
  error,
  flash,
  onRequestHide,
  onUnhide,
}: {
  manuallyHidden: boolean;
  manuallyHiddenAt: string | null;
  manuallyHiddenByEmail: string | null;
  manuallyHiddenReason: string | null;
  isActive: boolean;
  discontinuedDetectedAt: string | null;
  busy: boolean;
  error: string | null;
  flash: string | null;
  onRequestHide: () => void;
  onUnhide: () => void;
}) {
  const Icon = manuallyHidden ? EyeOff : Eye;
  const stateLabel = manuallyHidden
    ? 'Hidden from customers'
    : 'Visible to customers';
  const stateTone = manuallyHidden
    ? 'text-slate-700 bg-slate-100 ring-slate-300'
    : 'text-emerald-700 bg-emerald-50 ring-emerald-200';

  const sinceLabel = manuallyHidden
    ? formatHiddenSince(manuallyHiddenAt)
    : null;

  return (
    <Card
      icon={Icon}
      title="Visibility"
      description="Control whether this product appears in catalog browse, sitemap, and Google Shopping."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
              stateTone,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {stateLabel}
          </span>
          {manuallyHidden && sinceLabel && (
            <span className="text-xs text-slate-500">
              since {sinceLabel}
              {manuallyHiddenByEmail
                ? ` by ${manuallyHiddenByEmail}`
                : ''}
            </span>
          )}
          {!manuallyHidden && !isActive && discontinuedDetectedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
              <Ban className="h-3.5 w-3.5" />
              Auto-hidden as discontinued
            </span>
          )}
        </div>

        {manuallyHidden && manuallyHiddenReason && (
          <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">Reason:</span>{' '}
            {manuallyHiddenReason}
          </div>
        )}

        {!manuallyHidden && !isActive && discontinuedDetectedAt && (
          <p className="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              SS Activewear hasn&rsquo;t returned this product since{' '}
              {formatHiddenSince(discontinuedDetectedAt)}. It was auto-hidden
              after the 48-hour grace window. Customers see a &ldquo;no longer
              available&rdquo; message at the product URL.
            </span>
          </p>
        )}

        {manuallyHidden ? (
          <p className="flex items-start gap-1.5 rounded-md bg-stone-50 px-3 py-2 text-xs text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
            <span>
              Customers visiting the product URL see a &ldquo;no longer
              available&rdquo; page with no Add to Cart. The product is
              excluded from catalog browse, sitemap, and Google Shopping.
              Google Merchant Center typically re-syncs within 24 hours.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-1.5 rounded-md bg-stone-50 px-3 py-2 text-xs text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
            <span>
              Hide this product when a supplier privately tells you it&rsquo;s
              dead but their public catalog still lists it (so the
              auto-discontinued check won&rsquo;t catch it).
            </span>
          </p>
        )}

        {error && (
          <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {flash && !error && (
          <div className="flex items-start gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>{flash}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {manuallyHidden ? (
            <button
              type="button"
              onClick={onUnhide}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {busy ? 'Saving…' : 'Make visible to customers'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestHide}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <EyeOff className="h-4 w-4" />
              Hide from customers
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function HideConfirmModal({
  reason,
  setReason,
  busy,
  onCancel,
  onConfirm,
}: {
  reason: string;
  setReason: (v: string) => void;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const tooLong = reason.length > HIDE_REASON_MAX_CHARS;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-red-50 p-2 text-red-600">
              <EyeOff className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-800">
                Hide this product from customers?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                The product page will show &ldquo;no longer available&rdquo;
                instead of Add to Cart. It will be removed from catalog
                browse, sitemap, and Google Shopping.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <label
            htmlFor="hide-reason"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Reason{' '}
            <span className="font-normal text-slate-400">
              (optional, internal only)
            </span>
          </label>
          <textarea
            id="hide-reason"
            ref={textareaRef}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='e.g. "Supplier emailed 4/29: dropping this style; SS still listing it."'
            className={cn(
              'w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2',
              tooLong
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-stone-300 focus:border-brand-400 focus:ring-brand-100',
            )}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Visible only on this admin page. Customers never see it.
            </span>
            <span
              className={cn(
                'tabular-nums',
                tooLong ? 'text-red-600' : 'text-slate-400',
              )}
            >
              {reason.length} / {HIDE_REASON_MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || tooLong}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            {busy ? 'Hiding…' : 'Hide from customers'}
          </button>
        </div>
      </div>
    </div>
  );
}
