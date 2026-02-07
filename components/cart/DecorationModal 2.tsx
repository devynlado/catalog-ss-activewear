'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Paintbrush, 
  Scissors, 
  Check, 
  Sparkles, 
  Upload, 
  X, 
  ArrowRight,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  FileCheck
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { trackOpenDecorationModal, trackAddDecoration, trackCustomQuoteRequest } from '@/lib/analytics';
import {
  DecorationType,
  DecorationPackage,
  DecorationSelection,
  SCREEN_PRINT_PACKAGES,
  EMBROIDERY_PACKAGES,
  getPackagePrice,
  getAllInPrice,
  getNextScreenPrintBreak,
  getNextEmbroideryBreak,
  PackagePricing,
} from '@/lib/decoration-pricing';

// Recommended package IDs
const RECOMMENDED_PACKAGES = ['sp-front-back', 'emb-left-chest'];

interface DecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalView = 'packages' | 'custom-form';

export function DecorationModal({ isOpen, onClose }: DecorationModalProps) {
  const [decorationType, setDecorationType] = useState<DecorationType>('screen-print');
  const [view, setView] = useState<ModalView>('packages');
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Custom quote form state
  const [customForm, setCustomForm] = useState({
    description: '',
    email: '',
    phone: '',
  });

  const items = useCartStore((s) => s.items);
  const setDecoration = useCartStore((s) => s.setDecoration);
  const totalUnits = useCartStore((s) => s.getTotalUnits());

  const packages = decorationType === 'screen-print' 
    ? SCREEN_PRINT_PACKAGES 
    : EMBROIDERY_PACKAGES;

  // Track modal open
  useEffect(() => {
    if (isOpen && totalUnits > 0) {
      const cartValue = items.reduce((sum, item) => 
        sum + (item.discountedPrice ?? item.unitPrice) * item.quantity, 0
      );
      trackOpenDecorationModal({ totalUnits, cartValue });
    }
  }, [isOpen]); // Only track when isOpen changes to true

  const handleSelectPackage = (pkg: DecorationPackage) => {
    if (pkg.isCustom) {
      // Track custom quote request
      trackCustomQuoteRequest({
        decorationType,
        totalUnits,
      });
      setView('custom-form');
      return;
    }

    const allInPricing = getAllInPrice(pkg, totalUnits);
    const basePricing = getPackagePrice(pkg, totalUnits);
    if (!allInPricing || !basePricing) return;

    const selection: DecorationSelection = {
      type: decorationType,
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerPiece: allInPricing.allInPricePerPiece, // Use all-in pricing
      setupFee: 0, // Setup is baked into all-in price
      totalPrice: allInPricing.totalPrice,
      quantity: totalUnits,
      artworkFileName: artworkFile?.name,
    };

    // Track decoration selection
    trackAddDecoration({
      decorationType,
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerPiece: allInPricing.allInPricePerPiece,
      totalValue: allInPricing.totalPrice,
      quantity: totalUnits,
    });

    setDecoration(selection);
    onClose();
  };

  const handleArtworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArtworkFile(file);
    }
  };

  const handleRemoveArtwork = () => {
    setArtworkFile(null);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build cart summary for the quote
      const cartSummary = items.map(item => ({
        name: item.productName,
        color: item.colorName,
        size: item.sizeName,
        quantity: item.quantity,
        sku: item.sku,
      }));

      const response = await fetch('/api/quotes/decoration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decorationType,
          description: customForm.description,
          email: customForm.email,
          phone: customForm.phone,
          totalUnits,
          cartItems: cartSummary,
          artworkFileName: artworkFile?.name,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset form after a delay
        setTimeout(() => {
          setSubmitSuccess(false);
          setView('packages');
          setCustomForm({ description: '', email: '', phone: '' });
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit quote request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setView('packages');
    setSubmitSuccess(false);
    onClose();
  };

  // Get next price break for nudge
  const nextBreak = decorationType === 'screen-print'
    ? getNextScreenPrintBreak(totalUnits, 1)
    : getNextEmbroideryBreak(totalUnits, 1);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      {/* Reduced top padding on mobile (drag indicator already provides spacing) */}
      <div className="px-4 pt-2 pb-4 sm:p-6">
        {view === 'packages' ? (
          <>
            {/* Header with Trust Banner */}
            <div className="mb-5 sm:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Add Decoration to Your Order</h2>
              <p className="mt-1 text-sm lg:text-base text-slate-600">
                No waiting for quotes — select a package and checkout.
              </p>
              
              {/* Trust Badges */}
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  Free art setup
                </span>
                <span className="flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  Proof emailed in 1-2 days
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  Ships in 7-10 days
                </span>
              </div>
            </div>

            {/* Type Toggle - Soft Craft Styling */}
            <div className="mb-6">
              <div className="flex rounded-xl bg-gradient-to-r from-stone-100 to-stone-50 p-1 border border-stone-200/50">
                <button
                  onClick={() => setDecorationType('screen-print')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                    decorationType === 'screen-print'
                      ? 'bg-white text-slate-900 shadow-md shadow-stone-200/50 border border-stone-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Paintbrush className="h-4 w-4" />
                  Screen Printing
                </button>
                <button
                  onClick={() => setDecorationType('embroidery')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                    decorationType === 'embroidery'
                      ? 'bg-white text-slate-900 shadow-md shadow-stone-200/50 border border-stone-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Scissors className="h-4 w-4" />
                  Embroidery
                </button>
              </div>
            </div>

            {/* Price Break Nudge */}
            {nextBreak && nextBreak.unitsNeeded <= 50 && (
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200/50 p-3">
                <Sparkles className="h-4 w-4 text-brand-500 flex-shrink-0" />
                <p className="text-sm text-brand-800">
                  <span className="font-semibold">Add {nextBreak.unitsNeeded} more pieces</span> to save{' '}
                  {formatPrice(nextBreak.savingsPerPiece)}/piece
                </p>
              </div>
            )}

            {/* Package Cards */}
            <div className="space-y-3 mb-4">
              {packages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  quantity={totalUnits}
                  isRecommended={RECOMMENDED_PACKAGES.includes(pkg.id)}
                  onSelect={() => handleSelectPackage(pkg)}
                />
              ))}
            </div>

            {/* Guarantee */}
            <p className="text-xs lg:text-sm text-slate-500 text-center mb-5">
              <Shield className="h-3.5 w-3.5 lg:h-4 lg:w-4 inline mr-1 text-green-600" />
              100% satisfaction guaranteed — we'll make it right or refund your decoration cost.
            </p>

            {/* Artwork Upload */}
            <div className="border-t border-stone-100 pt-5">
              <label className="block text-sm lg:text-base font-medium text-slate-700 mb-2">
                Artwork (optional)
              </label>
              {artworkFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-3 lg:p-4">
                  <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-brand-500" />
                  <span className="flex-1 text-sm lg:text-base text-slate-700 truncate">{artworkFile.name}</span>
                  <button
                    onClick={handleRemoveArtwork}
                    className="rounded-lg p-1 text-slate-400 hover:bg-stone-200 hover:text-slate-600"
                  >
                    <X className="h-4 w-4 lg:h-5 lg:w-5" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-gradient-to-br from-stone-50/50 to-white p-5 lg:p-6 transition-colors hover:border-brand-300 hover:bg-brand-50/30">
                  <Upload className="h-5 w-5 lg:h-6 lg:w-6 text-slate-400" />
                  <span className="text-sm lg:text-base text-slate-600">
                    Drag & drop or <span className="text-brand-600 font-medium">browse</span>
                  </span>
                  <span className="text-xs lg:text-sm text-slate-500">
                    No artwork yet? We'll reach out within 1 business day.
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleArtworkChange}
                  />
                </label>
              )}
            </div>
          </>
        ) : (
          /* Custom Quote Form */
          <CustomQuoteForm
            decorationType={decorationType}
            items={items}
            totalUnits={totalUnits}
            formData={customForm}
            setFormData={setCustomForm}
            artworkFile={artworkFile}
            onArtworkChange={handleArtworkChange}
            onRemoveArtwork={handleRemoveArtwork}
            onSubmit={handleCustomSubmit}
            onBack={() => setView('packages')}
            isSubmitting={isSubmitting}
            submitSuccess={submitSuccess}
          />
        )}
      </div>
    </Modal>
  );
}

// ============ Package Card Component ============

interface PackageCardProps {
  package: DecorationPackage;
  quantity: number;
  isRecommended?: boolean;
  onSelect: () => void;
}

function PackageCard({ package: pkg, quantity, isRecommended, onSelect }: PackageCardProps) {
  const allInPricing = getAllInPrice(pkg, quantity);
  const isAvailable = quantity >= 50;

  // Different styles based on card type
  const getCardStyles = () => {
    if (pkg.isCustom) {
      // Custom - muted styling
      return 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-stone-50';
    }
    if (isRecommended && isAvailable) {
      // Recommended - elevated styling
      return 'border-brand-200 bg-gradient-to-br from-white to-brand-50/30 shadow-md shadow-brand-100/50 hover:shadow-lg hover:border-brand-300';
    }
    if (isAvailable) {
      // Standard - clean styling
      return 'border-stone-200 bg-gradient-to-br from-white to-stone-50 hover:border-brand-200 hover:shadow-md';
    }
    // Unavailable
    return 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed';
  };

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable && !pkg.isCustom}
      className={cn(
        'w-full text-left rounded-xl border p-4 lg:p-5 transition-all',
        getCardStyles()
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold lg:text-lg text-slate-900">{pkg.name}</h3>
            {isRecommended && !pkg.isCustom && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                Recommended
              </span>
            )}
            {pkg.isCustom && (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                Quote
              </span>
            )}
            {!pkg.isCustom && pkg.colors && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Up to {pkg.colors} colors
              </span>
            )}
          </div>
          <p className="mt-1 text-sm lg:text-base text-slate-600">{pkg.description}</p>
        </div>
        
        <div className="text-right flex-shrink-0">
          {pkg.isCustom ? (
            <span className="text-sm lg:text-base font-medium text-brand-600">Get Quote →</span>
          ) : allInPricing ? (
            <>
              <div className="text-lg lg:text-xl font-bold text-slate-900">
                {formatPrice(allInPricing.allInPricePerPiece)}<span className="text-sm lg:text-base font-medium text-slate-500">/pc</span>
              </div>
              <div className="text-xs lg:text-sm text-slate-500">
                {formatPrice(allInPricing.totalPrice)} for {quantity} pcs
              </div>
            </>
          ) : (
            <span className="text-xs lg:text-sm text-slate-400">Min 50 pcs</span>
          )}
        </div>
      </div>
      
      {(isAvailable || pkg.isCustom) && !pkg.isCustom && (
        <div className="mt-3 flex items-center justify-end gap-1 text-sm lg:text-base font-medium text-brand-600">
          Select
          <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
        </div>
      )}
    </button>
  );
}

// ============ Custom Quote Form Component ============

interface CustomQuoteFormProps {
  decorationType: DecorationType;
  items: any[];
  totalUnits: number;
  formData: { description: string; email: string; phone: string };
  setFormData: (data: any) => void;
  artworkFile: File | null;
  onArtworkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveArtwork: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitSuccess: boolean;
}

function CustomQuoteForm({
  decorationType,
  items,
  totalUnits,
  formData,
  setFormData,
  artworkFile,
  onArtworkChange,
  onRemoveArtwork,
  onSubmit,
  onBack,
  isSubmitting,
  submitSuccess,
}: CustomQuoteFormProps) {
  if (submitSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Quote Request Submitted!</h3>
        <p className="mt-2 text-sm text-slate-600">
          We'll respond within 24 hours with your custom quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Back to packages
      </button>

      {/* Cart Items Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Your Items</h3>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600 truncate flex-1">
                  {item.productName} - {item.colorName} ({item.sizeName})
                </span>
                <span className="text-slate-900 font-medium ml-2">×{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-200 flex justify-between text-sm font-medium">
            <span className="text-slate-700">Total Pieces</span>
            <span className="text-slate-900">{totalUnits}</span>
          </div>
        </div>
      </div>

      {/* Decoration Type */}
      <div className="mb-4">
        <span className="text-sm text-slate-600">
          Decoration: <span className="font-medium text-slate-900 capitalize">{decorationType.replace('-', ' ')}</span>
        </span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-1" />
          Tell us what you need
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="E.g., Full back print with 6 colors, different front design for each color..."
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
          required
        />
      </div>

      {/* Artwork Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Artwork (optional)
        </label>
        {artworkFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <FileText className="h-5 w-5 text-brand-500" />
            <span className="flex-1 text-sm text-slate-700 truncate">{artworkFile.name}</span>
            <button
              type="button"
              onClick={onRemoveArtwork}
              className="rounded-lg p-1 text-slate-400 hover:bg-stone-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 transition-colors hover:border-brand-400">
            <Upload className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-600">Upload artwork (can add later)</span>
            <input type="file" className="hidden" onChange={onArtworkChange} />
          </label>
        )}
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Mail className="h-4 w-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Phone className="h-4 w-4 inline mr-1" />
            Phone (optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Request Custom Quote
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <p className="mt-3 text-center text-xs text-slate-500">
        We'll respond within 24 hours with your custom quote.
      </p>
    </form>
  );
}
