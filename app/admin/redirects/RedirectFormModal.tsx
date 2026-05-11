'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Info, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ProductPicker, type PickedProduct } from './ProductPicker';
import { SuggestionsPanel } from './SuggestionsPanel';
import type { RedirectRow } from './types';

type TargetType = 'product' | 'category' | 'gone';

interface RedirectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, edit this row. When null, create a new one. */
  editing: RedirectRow | null;
  /** Optional: pre-fill `from_slug` (used from the unresolved-queue flow). */
  presetFromSlug?: string | null;
  /**
   * Optional: pre-fill the target product. Used when the admin clicks
   * "Use this" on an inline suggestion — the modal opens with both the
   * from-slug AND the chosen product already populated so the only
   * remaining step is review-and-confirm.
   */
  presetProduct?: PickedProduct | null;
  /**
   * Optional: when the form was opened from an unresolved-slug row, this
   * key is passed back to the create endpoint so it can mark that row
   * resolved in the same request.
   */
  resolvedSlugKey?: string | null;
}

const DEFAULT_PROMOTE_DAYS = 14;

export function RedirectFormModal({
  isOpen,
  onClose,
  onSaved,
  editing,
  presetFromSlug,
  presetProduct,
  resolvedSlugKey,
}: RedirectFormModalProps) {
  const isEdit = !!editing;

  const [fromSlug, setFromSlug] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('product');
  const [product, setProduct] = useState<PickedProduct | null>(null);
  const [toUrl, setToUrl] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 302>(302);
  const [autoPromoteEnabled, setAutoPromoteEnabled] = useState(true);
  const [autoPromoteDays, setAutoPromoteDays] = useState(DEFAULT_PROMOTE_DAYS);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset form when modal opens, edit target changes, or preset slug changes.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setShowConfirm(false);
    if (editing) {
      setFromSlug(editing.from_slug);
      setTargetType(editing.target_type);
      setProduct(
        editing.target_product
          ? {
              style_id: editing.target_product.style_id,
              style_name: editing.target_product.style_name,
              brand_name: editing.target_product.brand_name,
              title:
                editing.target_product.title_optimized ||
                editing.target_product.title_raw ||
                editing.target_product.style_name,
              primary_image_url: null,
              slug: editing.target_product.slug,
              is_active: editing.target_product.is_active,
              manually_hidden: editing.target_product.manually_hidden,
            }
          : null,
      );
      setToUrl(editing.to_url ?? '');
      setStatusCode(editing.status_code === 301 ? 301 : 302);
      setAutoPromoteEnabled(editing.promote_to_301_at != null);
      setAutoPromoteDays(DEFAULT_PROMOTE_DAYS);
      setIsActive(editing.is_active);
      setNotes(editing.notes ?? '');
    } else {
      setFromSlug(presetFromSlug ?? '');
      setTargetType('product');
      setProduct(presetProduct ?? null);
      setToUrl('');
      setStatusCode(302);
      setAutoPromoteEnabled(true);
      setAutoPromoteDays(DEFAULT_PROMOTE_DAYS);
      setIsActive(true);
      setNotes('');
    }
  }, [isOpen, editing, presetFromSlug, presetProduct]);

  /** Final URL the visitor will land on (used in the confirm screen). */
  const previewUrl = useMemo(() => {
    if (targetType === 'product') return product?.slug ? `/product/${product.slug}` : null;
    if (targetType === 'category') return toUrl.trim() || null;
    return null; // 'gone' = 404
  }, [targetType, product, toUrl]);

  function validate(): string | null {
    if (!fromSlug.trim()) return 'From slug is required.';
    if (targetType === 'product' && !product) return 'Please pick a target product.';
    if (targetType === 'category') {
      const url = toUrl.trim();
      if (!url) return 'Please enter a destination URL.';
      if (!url.startsWith('/')) {
        return 'Destination URL must be a site-relative path starting with "/".';
      }
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        from_slug: fromSlug.trim(),
        target_type: targetType,
        status_code: statusCode,
        is_active: isActive,
        notes: notes.trim() || null,
        auto_promote_days:
          statusCode === 302 && autoPromoteEnabled ? autoPromoteDays : null,
      };
      if (targetType === 'product') payload.to_product_id = product?.style_id ?? null;
      if (targetType === 'category') payload.to_url = toUrl.trim();
      if (!isEdit && resolvedSlugKey) payload.resolved_slug_key = resolvedSlugKey;

      const url = isEdit ? `/api/admin/redirects/${editing!.id}` : '/api/admin/redirects';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save redirect.');
        setShowConfirm(false);
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Redirect' : 'New Redirect'}
      size="lg"
    >
      {showConfirm ? (
        <ConfirmStep
          fromSlug={fromSlug}
          targetType={targetType}
          product={product}
          toUrl={toUrl}
          previewUrl={previewUrl}
          statusCode={statusCode}
          autoPromoteEnabled={autoPromoteEnabled}
          autoPromoteDays={autoPromoteDays}
          isActive={isActive}
          isEdit={isEdit}
          saving={saving}
          error={error}
          onBack={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FROM SLUG */}
          <div>
            <Input
              label="From slug"
              required
              value={fromSlug}
              onChange={(e) => setFromSlug(e.target.value)}
              placeholder="e.g. heavyweight-t-shirt"
              hint="The path under /product/ that you want to redirect FROM. Lowercase, hyphens; we strip a leading /product/ if you paste it."
            />
          </div>

          {/* TARGET TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Redirect type<span className="ml-0.5 text-red-500">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <TargetTypeOption
                value="product"
                current={targetType}
                label="Product"
                description="Send to a specific SKU"
                onChange={setTargetType}
              />
              <TargetTypeOption
                value="category"
                current={targetType}
                label="Category"
                description="Send to a catalog page"
                onChange={setTargetType}
              />
              <TargetTypeOption
                value="gone"
                current={targetType}
                label="Gone / 404"
                description="Hard 404 + noindex"
                onChange={setTargetType}
              />
            </div>
          </div>

          {/* TARGET-SPECIFIC FIELDS */}
          {targetType === 'product' && (
            <div>
              <div className="mb-1.5 flex items-end justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Target product<span className="ml-0.5 text-red-500">*</span>
                </label>
                {fromSlug.trim() && !product && (
                  <SuggestionsPanel
                    slug={fromSlug.trim()}
                    onPick={(p) => setProduct(p)}
                    onNoStrongMatch={() => {
                      // Subtle hint: when the engine sees no strong match,
                      // expose the suggestion that the admin should
                      // consider a Category redirect instead. We don't
                      // auto-switch — the admin is still in control.
                    }}
                    autoRun={!isEdit && presetFromSlug === fromSlug}
                  />
                )}
              </div>
              <ProductPicker value={product} onChange={setProduct} disabled={saving} />
              {!product && fromSlug.trim() && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Pick manually above, or use <em>Suggest match</em> to score candidates against the
                  from-slug.
                </p>
              )}
              {product && (product.manually_hidden || !product.is_active) && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  This product is currently {product.manually_hidden ? 'hidden' : 'inactive'}. The
                  redirect will be saved, but at runtime it will fall back to a 404 until the product is restored.
                </p>
              )}
            </div>
          )}
          {targetType === 'category' && (
            <Input
              label="Destination URL"
              required
              value={toUrl}
              onChange={(e) => setToUrl(e.target.value)}
              placeholder="/catalog?category=t-shirts&filter=heavyweight"
              hint="Site-relative path starting with /. Existing query parameters are preserved across the redirect."
            />
          )}
          {targetType === 'gone' && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                <span>
                  Visitors hitting this slug will get a hard 404 with{' '}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">noindex</code> so Google
                  drops it from search results.
                </span>
              </p>
            </div>
          )}

          {/* STATUS CODE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Redirect status
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <StatusCodeOption
                value={302}
                current={statusCode}
                label="Temporary (302)"
                description="Safe to undo. No SEO transfer yet."
                onChange={setStatusCode}
              />
              <StatusCodeOption
                value={301}
                current={statusCode}
                label="Permanent (301)"
                description="Transfers SEO. Cached by browsers."
                onChange={setStatusCode}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              We recommend starting with 302 and letting it auto-promote to 301 after a verified
              window. Note: Next.js serves these as HTTP 307/308 respectively, which are
              SEO-equivalent to 301/302.
            </p>
          </div>

          {/* AUTO-PROMOTE */}
          {statusCode === 302 && (
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={autoPromoteEnabled}
                  onChange={(e) => setAutoPromoteEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Auto-promote to 301 after a verification window
              </label>
              {autoPromoteEnabled && (
                <div className="mt-3 flex items-center gap-2 pl-6">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={autoPromoteDays}
                    onChange={(e) => setAutoPromoteDays(Number(e.target.value) || 1)}
                    className="w-20 rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-sm text-slate-600">days from now</span>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE */}
          <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Active</label>
              <p className="text-xs text-slate-500">
                Inactive redirects are ignored at runtime. Use this for one-click rollback.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
            />
          </div>

          {/* NOTES */}
          <Textarea
            label="Notes (optional)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='e.g. "Legacy WordPress slug discovered via Meta Catalog audit."'
          />

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              Review & save
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TargetTypeOption({
  value,
  current,
  label,
  description,
  onChange,
}: {
  value: TargetType;
  current: TargetType;
  label: string;
  description: string;
  onChange: (v: TargetType) => void;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
          : 'border-stone-200 bg-white hover:border-stone-300'
      }`}
    >
      <div className="text-sm font-semibold text-navy-800">{label}</div>
      <div className="mt-0.5 text-xs text-slate-600">{description}</div>
    </button>
  );
}

function StatusCodeOption({
  value,
  current,
  label,
  description,
  onChange,
}: {
  value: 301 | 302;
  current: 301 | 302;
  label: string;
  description: string;
  onChange: (v: 301 | 302) => void;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
          : 'border-stone-200 bg-white hover:border-stone-300'
      }`}
    >
      <div className="text-sm font-semibold text-navy-800">{label}</div>
      <div className="mt-0.5 text-xs text-slate-600">{description}</div>
    </button>
  );
}

interface ConfirmStepProps {
  fromSlug: string;
  targetType: TargetType;
  product: PickedProduct | null;
  toUrl: string;
  previewUrl: string | null;
  statusCode: 301 | 302;
  autoPromoteEnabled: boolean;
  autoPromoteDays: number;
  isActive: boolean;
  isEdit: boolean;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

function ConfirmStep({
  fromSlug,
  targetType,
  product,
  toUrl,
  previewUrl,
  statusCode,
  autoPromoteEnabled,
  autoPromoteDays,
  isActive,
  isEdit,
  saving,
  error,
  onBack,
  onConfirm,
}: ConfirmStepProps) {
  return (
    <div className="space-y-4 p-5 sm:p-6">
      <p className="text-sm text-slate-600">
        Please confirm this redirect before saving. You can always toggle it off later from the
        list.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          Preview
        </div>
        <div className="space-y-3 p-4 text-sm">
          <div className="flex items-center gap-3">
            <code className="rounded bg-stone-100 px-2 py-1 font-mono text-xs text-slate-800">
              /product/{fromSlug}
            </code>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            {targetType === 'gone' ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase text-red-700">
                404 / noindex
              </span>
            ) : (
              <code className="rounded bg-brand-50 px-2 py-1 font-mono text-xs text-brand-800">
                {previewUrl ?? '(unresolved)'}
              </code>
            )}
          </div>
          {targetType === 'product' && product && (
            <div className="rounded-md border border-stone-100 bg-stone-50/50 p-2 text-xs text-slate-600">
              <span className="font-medium text-navy-800">
                {product.brand_name} {product.style_name}
              </span>{' '}
              — {product.title}
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-brand-600 hover:underline"
                >
                  open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
          {targetType === 'category' && toUrl && (
            <a
              href={toUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              open destination <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <dl className="grid gap-2 rounded-lg border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Status</dt>
          <dd className="font-medium text-navy-800">
            {statusCode === 301 ? 'Permanent (301)' : 'Temporary (302)'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Auto-promote</dt>
          <dd className="font-medium text-navy-800">
            {statusCode === 301
              ? 'N/A (already permanent)'
              : autoPromoteEnabled
                ? `In ${autoPromoteDays} day${autoPromoteDays === 1 ? '' : 's'}`
                : 'Disabled'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Active</dt>
          <dd className="font-medium text-navy-800">{isActive ? 'Yes' : 'No (saved off)'}</dd>
        </div>
      </dl>

      <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={saving} isLoading={saving}>
          {isEdit ? 'Save changes' : 'Create redirect'}
        </Button>
      </div>
    </div>
  );
}
