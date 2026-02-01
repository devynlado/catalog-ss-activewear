'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DecorationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  productStyleId: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Add Your Logo
        </h2>
        
        <p className="text-slate-600 mb-6">
          Decoration services coming soon. Contact us for a custom quote on screen printing, 
          embroidery, and finishing services.
        </p>

        <div className="bg-stone-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Style:</span>
            <span className="font-medium text-slate-900">{productStyleId}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-slate-600">Quantity:</span>
            <span className="font-medium text-slate-900">{totalPieces} pieces</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
