'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader2, CheckCircle2, Phone } from 'lucide-react';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';
import { getVisitorSource } from '@/lib/attribution';

const DECORATION_OPTIONS = [
  { value: 'screen-printing', label: 'Screen Printing' },
  { value: 'puff-screen-printing', label: 'Puff Printing' },
  { value: 'jumbo-screen-printing', label: 'Jumbo Screen Printing' },
  { value: 'digital-screen-printing', label: 'Digital Screen' },
  { value: 'simulated-process', label: 'Simulated Process' },
  { value: 'embroidery', label: 'Embroidery' },
];

const PRODUCT_OPTIONS = [
  'T-shirt',
  'Sweatshirt',
  'Polo',
  'Jacket',
  'Headwear',
  'Bottoms',
  'Bags',
  'Accessories',
  'Workwear',
];

const TURNAROUND_OPTIONS = [
  { value: '2-4-days', label: '2-4 business days (Rush)' },
  { value: '5-10-days', label: '5-10 business days' },
  { value: '10-15-days', label: '10-15 business days' },
];

interface PortfolioQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDecoration?: string;
  projectTitle?: string;
}

export function PortfolioQuoteModal({
  isOpen,
  onClose,
  defaultDecoration,
  projectTitle,
}: PortfolioQuoteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    decoration: defaultDecoration || '',
    product: '',
    quantity: '',
    turnaround: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const buildMessage = () => {
    const lines: string[] = [];
    if (projectTitle) lines.push(`Inquiry from portfolio: ${projectTitle}`);
    const dec = DECORATION_OPTIONS.find((o) => o.value === formData.decoration);
    if (dec) lines.push(`Decoration: ${dec.label}`);
    if (formData.product) lines.push(`Product: ${formData.product}`);
    if (formData.quantity) lines.push(`Quantity: ${formData.quantity}`);
    const turn = TURNAROUND_OPTIONS.find((o) => o.value === formData.turnaround);
    if (turn) lines.push(`Turnaround: ${turn.label}`);
    if (formData.notes) lines.push(`\nNotes:\n${formData.notes}`);
    return lines.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          message: buildMessage(),
          service: DECORATION_OPTIONS.find((o) => o.value === formData.decoration)?.label || 'Portfolio Inquiry',
          source: 'portfolio_quote_modal',
          quantity: formData.quantity || undefined,
          visitor_source: getVisitorSource(),
        }),
      });

      if (!res.ok) throw new Error('Submit failed');

      trackGenerateLead({ source: 'portfolio_quote_modal', value: 300 });
      setIsSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or call us at (855) 942-7636.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputCls =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors';
  const selectCls = `${inputCls} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8`;
  const labelCls = 'block text-xs font-medium text-slate-700 mb-1';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 fade-in duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quote Request Received!</h3>
            <p className="text-slate-600 text-sm mb-6">
              We&apos;ll get back to you within 2 hours during business hours.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+18559427636"
                onClick={() => trackPhoneClick({ source: 'portfolio_quote_modal_confirmation' })}
                className="inline-flex items-center justify-center gap-2 text-brand-600 font-semibold hover:text-brand-700 text-sm"
              >
                <Phone className="h-4 w-4" />
                Need it faster? Call (855) 942-7636
              </a>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Header */}
            <div className="mb-5 pr-8">
              <h3 className="text-lg font-bold text-slate-900">Request a Quote</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                We&apos;ll respond within 2 hours during business hours.
              </p>
            </div>

            <div className="space-y-4">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pq-name" className={labelCls}>Full Name *</label>
                  <input id="pq-name" type="text" required value={formData.name} onChange={set('name')} className={inputCls} placeholder="Jane Smith" />
                </div>
                <div>
                  <label htmlFor="pq-email" className={labelCls}>Email *</label>
                  <input id="pq-email" type="email" required value={formData.email} onChange={set('email')} className={inputCls} placeholder="jane@company.com" />
                </div>
              </div>

              {/* Row 2: Phone + Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pq-phone" className={labelCls}>Phone</label>
                  <input id="pq-phone" type="tel" value={formData.phone} onChange={set('phone')} className={inputCls} placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label htmlFor="pq-company" className={labelCls}>Company</label>
                  <input id="pq-company" type="text" value={formData.company} onChange={set('company')} className={inputCls} placeholder="Company name" />
                </div>
              </div>

              {/* Row 3: Decoration + Product */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pq-decoration" className={labelCls}>Decoration *</label>
                  <select id="pq-decoration" required value={formData.decoration} onChange={set('decoration')} className={selectCls}>
                    <option value="">Select decoration</option>
                    {DECORATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pq-product" className={labelCls}>Product *</label>
                  <select id="pq-product" required value={formData.product} onChange={set('product')} className={selectCls}>
                    <option value="">Select product</option>
                    {PRODUCT_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Quantity + Turnaround */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pq-quantity" className={labelCls}>Quantity *</label>
                  <input id="pq-quantity" type="text" required value={formData.quantity} onChange={set('quantity')} className={inputCls} placeholder="e.g. 200" />
                </div>
                <div>
                  <label htmlFor="pq-turnaround" className={labelCls}>Turnaround *</label>
                  <select id="pq-turnaround" required value={formData.turnaround} onChange={set('turnaround')} className={selectCls}>
                    <option value="">Select turnaround</option>
                    {TURNAROUND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="pq-notes" className={labelCls}>Notes</label>
                <textarea
                  id="pq-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={set('notes')}
                  className={`${inputCls} resize-none`}
                  placeholder="Any additional details — design ideas, special requirements, etc."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Quote Request
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              No obligation &middot; Free consultation &middot; Dedicated rep
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
