'use client';

import { X, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DecorationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  productStyleId: string | number;
  totalPieces: number;
  totalAmount: number;
}

export function DecorationMethodModal({
  isOpen,
  onClose,
  productStyleId,
  totalPieces,
  totalAmount,
}: DecorationMethodModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Your Logo</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
            <Paintbrush className="h-8 w-8 text-brand-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Decoration Services Coming Soon
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Screen printing, embroidery, and other decoration options will be available shortly.
            For now, please submit a quote request and our team will help you with customization.
          </p>
          <Button onClick={onClose} className="w-full">
            Got It
          </Button>
        </div>
      </div>
    </>
  );
}
