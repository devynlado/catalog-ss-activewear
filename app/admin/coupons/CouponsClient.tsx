'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  amount: number;
  free_shipping: boolean;
  min_cart_amount: number | null;
  max_discount_amount: number | null;
  applies_to: string;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  usage_limit_per_customer: number | null;
  created_at: string;
  updated_at: string;
}

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function discountLabel(type: string, amount: number, freeShipping: boolean) {
  const parts: string[] = [];
  if (type === 'percent_cart') parts.push(`${amount}% off`);
  else if (type === 'fixed_cart') parts.push(`$${amount} off`);
  else if (type === 'free_shipping') parts.push('Free shipping');
  if (freeShipping && type !== 'free_shipping') parts.push('+ free shipping');
  return parts.join(' ') || '—';
}

export function CouponsClient() {
  const [list, setList] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchList();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-slate-500">
        Loading coupons…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/admin/coupons/new">
          <Button variant="primary" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New coupon
          </Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No coupons yet. Create one to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Applies to
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Valid
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-navy-800">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {discountLabel(c.discount_type, c.amount, c.free_shipping)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.used_count}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.applies_to === 'cart_and_packages' ? 'Cart + packages' : 'Products only'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(c.starts_at)} – {formatDate(c.expires_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/admin/coupons/${c.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
