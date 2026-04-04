'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';
import { getVisitorSource } from '@/lib/attribution';

interface LPQuoteFormProps {
  service: 'screen-printing' | 'embroidery';
  source?: string;
  variant?: string;
}

const quantityOptions = [
  { value: '50-99', label: '50-99 pieces', estimatedValue: 200 },
  { value: '100-249', label: '100-249 pieces', estimatedValue: 400 },
  { value: '250-499', label: '250-499 pieces', estimatedValue: 750 },
  { value: '500-999', label: '500-999 pieces', estimatedValue: 1200 },
  { value: '1000+', label: '1,000+ pieces', estimatedValue: 2000 },
];

export function LPQuoteForm({ service, source, variant }: LPQuoteFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service: service,
          source: source || `lp_${service}`,
          variant: variant,
          visitor_source: getVisitorSource(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Track conversion in GA4
      const selectedQuantity = quantityOptions.find(q => q.value === formData.quantity);
      trackGenerateLead({
        source: source || `lp_${service}`,
        value: selectedQuantity?.estimatedValue || 300,
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl border border-stone-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-navy-800 mb-2">Quote Request Received!</h3>
        <p className="text-slate-600 mb-6">
          We'll get back to you within 2 hours during business hours.
        </p>
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">Need it faster?</p>
          <a
            href="tel:+18559427636"
            onClick={() => trackPhoneClick({ source: `lp_${service}_confirmation` })}
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
          >
            Call us now: (855) 942-7636
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-stone-200">
      <h3 className="text-xl font-bold text-navy-800 mb-1">Get Your Price in 2 Hours</h3>
      <p className="text-sm text-slate-500 mb-6">Free quote • No obligation</p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy-800 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            placeholder="Your name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy-800 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-navy-800 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-navy-800 mb-1">
            Estimated Quantity *
          </label>
          <select
            id="quantity"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
          >
            <option value="">Select quantity...</option>
            {quantityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-navy-800 mb-1">
            Project Details
          </label>
          <textarea
            id="message"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors resize-none"
            placeholder="Tell us about your project (optional)"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Get My Free Quote
            </>
          )}
        </button>
      </div>

      {/* Trust indicators below form */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
        <span>✓ No obligation</span>
        <span>✓ 2hr response</span>
        <span>✓ Price match</span>
      </div>
    </form>
  );
}
