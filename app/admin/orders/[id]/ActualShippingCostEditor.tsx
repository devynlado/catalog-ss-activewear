'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, X } from 'lucide-react';

interface ActualShippingCostEditorProps {
  orderId: string;
  currentValue: number | null;
  shippingCharged: number;
}

export function ActualShippingCostEditor({
  orderId,
  currentValue,
  shippingCharged,
}: ActualShippingCostEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue?.toFixed(2) ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const delta = currentValue !== null ? shippingCharged - currentValue : null;

  const handleSave = async () => {
    if (!value.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_shipping_cost: value }),
      });
      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500">Actual Shipping Cost</p>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-brand-300 bg-white py-1.5 pl-6 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
            className="rounded-md bg-brand-600 p-1.5 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setValue(currentValue?.toFixed(2) ?? '');
            }}
            className="rounded-md bg-stone-100 p-1.5 text-slate-600 hover:bg-stone-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">Actual Shipping Cost</p>
      <div className="flex items-center justify-between">
        {currentValue !== null ? (
          <div>
            <span className="text-sm font-medium text-slate-800">${currentValue.toFixed(2)}</span>
            {delta !== null && delta !== 0 && (
              <span className={`ml-2 text-xs font-medium ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {delta > 0 ? '+' : ''}{delta.toFixed(2)} vs charged
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm italic text-slate-400">Not entered</span>
        )}
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-md p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
