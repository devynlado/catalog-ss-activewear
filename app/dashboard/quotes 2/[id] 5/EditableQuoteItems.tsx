'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Package, Minus, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuoteItem {
  id: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

interface EditableQuoteItemsProps {
  quoteId: string;
  items: QuoteItem[];
  isEditable: boolean;
  onUpdate?: (items: QuoteItem[]) => void;
}

export function EditableQuoteItems({ quoteId, items: initialItems, isEditable, onUpdate }: EditableQuoteItemsProps) {
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const removeItem = (itemId: string) => {
    if (items.length === 1) {
      // Don't allow removing last item
      return;
    }
    setItems(prev => prev.filter(item => item.id !== itemId));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const saveChanges = async () => {
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setSaveStatus('saved');
      setHasChanges(false);
      onUpdate?.(items);
      
      // Reset status after a moment
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-stone-100">
        <h2 className="text-lg font-semibold text-navy-800">
          Items ({items.length})
        </h2>
        {isEditable && (
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600">Saved!</span>
            )}
          </div>
        )}
      </div>

      {/* Editable notice */}
      {isEditable && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">
            You can adjust quantities before your rep reviews this quote.
          </p>
        </div>
      )}
      
      {/* Items list */}
      <div className="p-5 space-y-3">
        {items.map((item, index) => (
          <div 
            key={item.id || index}
            className="flex items-center gap-4 rounded-lg border border-stone-100 bg-stone-50 p-4"
          >
            {/* Product image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.styleName || 'Product'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-stone-400" />
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800">
                {item.brandName} {item.styleName}
              </p>
              <p className="text-sm text-slate-500">
                {item.colorName} • {item.sizeName}
              </p>
              
              {/* Quantity controls or static display */}
              {isEditable ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-white text-slate-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-medium text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-white text-slate-600 hover:bg-stone-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm text-slate-500 ml-1">
                    × ${item.unitPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-600 mt-1">
                  Qty: {item.quantity} × ${item.unitPrice?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>

            {/* Price and remove */}
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-lg font-semibold text-navy-800">
                ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
              </p>
              {isEditable && items.length > 1 && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal and save */}
      <div className="border-t border-stone-200 p-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">
            Subtotal ({totalQuantity} pcs)
          </span>
          <span className="text-xl font-bold text-navy-800">
            ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {isEditable && hasChanges && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={saveChanges}
              disabled={saveStatus === 'saving'}
              className="flex-1"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setItems(initialItems);
                setHasChanges(false);
                setSaveStatus('idle');
              }}
            >
              Reset
            </Button>
          </div>
        )}

        {saveStatus === 'error' && (
          <p className="mt-2 text-sm text-red-600">
            Failed to save changes. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
