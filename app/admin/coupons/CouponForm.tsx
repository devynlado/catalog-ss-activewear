'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CouponRecord } from './CouponsClient';

type DiscountType = 'percent_cart' | 'fixed_cart' | 'free_shipping';
type AppliesTo = 'cart_and_packages' | 'products_only';

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: 'percent_cart', label: 'Percentage off cart' },
  { value: 'fixed_cart', label: 'Fixed amount off cart' },
  { value: 'free_shipping', label: 'Free shipping (economy only)' },
];

const APPLIES_TO_OPTIONS: { value: AppliesTo; label: string }[] = [
  { value: 'products_only', label: 'Main products only' },
  { value: 'cart_and_packages', label: 'Total cart (include packages)' },
];

interface CouponFormProps {
  initial?: CouponRecord | null;
  isNew: boolean;
}

export function CouponForm({ initial, isNew }: CouponFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [discount_type, setDiscountType] = useState<DiscountType>(
    (initial?.discount_type as DiscountType) ?? 'percent_cart'
  );
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : ''
  );
  const [free_shipping, setFreeShipping] = useState(initial?.free_shipping ?? false);
  const [min_cart_amount, setMinCartAmount] = useState(
    initial?.min_cart_amount != null ? String(initial.min_cart_amount) : ''
  );
  const [max_discount_amount, setMaxDiscountAmount] = useState(
    initial?.max_discount_amount != null ? String(initial.max_discount_amount) : ''
  );
  const [applies_to, setAppliesTo] = useState<AppliesTo>(
    (initial?.applies_to as AppliesTo) ?? 'products_only'
  );
  const [starts_at, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 16) : ''
  );
  const [expires_at, setExpiresAt] = useState(
    initial?.expires_at ? initial.expires_at.slice(0, 16) : ''
  );
  const [usage_limit, setUsageLimit] = useState(
    initial?.usage_limit != null ? String(initial.usage_limit) : ''
  );
  const [usage_limit_per_customer, setUsageLimitPerCustomer] = useState(
    initial?.usage_limit_per_customer != null
      ? String(initial.usage_limit_per_customer)
      : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        description: description.trim() || null,
        discount_type,
        amount: discount_type === 'free_shipping' ? 0 : Number(amount) || 0,
        free_shipping,
        min_cart_amount: min_cart_amount === '' ? null : Number(min_cart_amount),
        max_discount_amount:
          max_discount_amount === '' ? null : Number(max_discount_amount),
        applies_to,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        usage_limit: usage_limit === '' ? null : Number(usage_limit),
        usage_limit_per_customer:
          usage_limit_per_customer === ''
            ? null
            : Number(usage_limit_per_customer),
      };

      const url = isNew ? '/api/admin/coupons' : `/api/admin/coupons/${initial!.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      router.push('/admin/coupons');
      router.refresh();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SAVE10"
          disabled={!isNew}
        />
        <Input
          label="Description (internal)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Discount type
          </label>
          <select
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm"
            value={discount_type}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
          >
            {DISCOUNT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {discount_type !== 'free_shipping' && (
          <Input
            label="Amount"
            type="number"
            min={0}
            step={discount_type === 'percent_cart' ? 1 : 0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={discount_type === 'percent_cart' ? '15' : '25.00'}
          />
        )}
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={free_shipping}
            onChange={(e) => setFreeShipping(e.target.checked)}
            className="rounded border-stone-300"
          />
          <span className="text-sm text-slate-700">Also give free economy shipping</span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Minimum cart amount ($)"
          type="number"
          min={0}
          step={0.01}
          value={min_cart_amount}
          onChange={(e) => setMinCartAmount(e.target.value)}
          placeholder="Optional"
        />
        <Input
          label="Max discount cap ($, for % coupons)"
          type="number"
          min={0}
          step={0.01}
          value={max_discount_amount}
          onChange={(e) => setMaxDiscountAmount(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Applies to
        </label>
        <select
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm"
          value={applies_to}
          onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}
        >
          {APPLIES_TO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Starts at"
          type="datetime-local"
          value={starts_at}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <Input
          label="Expires at"
          type="datetime-local"
          value={expires_at}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Usage limit (total)"
          type="number"
          min={0}
          value={usage_limit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="Unlimited"
        />
        <Input
          label="Usage limit per customer"
          type="number"
          min={0}
          value={usage_limit_per_customer}
          onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
          placeholder="Unlimited"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create coupon' : 'Save changes'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/coupons')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
