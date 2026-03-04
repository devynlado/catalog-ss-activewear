'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Send, Loader2, CheckCircle2, Phone, Trash2 } from 'lucide-react';
import { useStreetWearInquiry } from '@/lib/streetwear-inquiry-store';
import { VOLUME_TIERS, type TierQty } from '@/lib/streetwear-config';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';

export function StreetWearForm() {
  const { selectedProducts, removeProduct, updateQty, clearAll } =
    useStreetWearInquiry();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const productSummary = selectedProducts
      .map((p) => `${p.title} (${p.preferredQty} pcs)`)
      .join('; ');

    const message = [
      selectedProducts.length > 0
        ? `Products: ${productSummary}`
        : 'No specific products selected',
      '',
      formData.message || '(No additional notes)',
    ].join('\n');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          message,
          service: 'Streetwear Brand Inquiry',
          source: 'streetwear',
          quantity:
            selectedProducts.length > 0
              ? `${selectedProducts.length} products`
              : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      const totalEstimate = selectedProducts.reduce(
        (sum, p) => sum + p.preferredQty * 25,
        0
      );
      trackGenerateLead({
        source: 'streetwear',
        value: totalEstimate || 500,
      });

      setIsSubmitted(true);
      clearAll();
    } catch {
      setError(
        'Something went wrong. Please try again or call us at (855) 942-7636.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <section id="inquiry-form" className="bg-stone-50 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Inquiry Received!
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            We&apos;ll reach out within 24 hours with a custom sourcing quote.
            Your dedicated rep will handle everything from here.
          </p>
          <div className="mt-8">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'streetwear_form_success' })}
              className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
            >
              <Phone className="h-4 w-4" />
              Or call us now: (855) 942-7636
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="inquiry-form" className="bg-stone-50 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Get a Sourcing Quote
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Tell us what you need and we&apos;ll put together a custom sourcing quote
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Selected Products Summary */}
          {selectedProducts.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700">
                Your Selected Products
              </label>
              <div className="mt-2 space-y-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 p-3"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={`/images/streetwear/${product.image}`}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {product.title}
                      </p>
                    </div>
                    <select
                      value={product.preferredQty}
                      onChange={(e) =>
                        updateQty(
                          product.productId,
                          Number(e.target.value) as TierQty
                        )
                      }
                      className="rounded-md border-stone-300 py-1 pl-2 pr-7 text-sm"
                    >
                      {VOLUME_TIERS.map((tier) => (
                        <option key={tier.qty} value={tier.qty}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.productId)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProducts.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
              No products selected yet.{' '}
              <a href="#products" className="font-medium text-brand-600 hover:text-brand-700">
                Browse products above
              </a>{' '}
              to add items to your inquiry, or describe what you&apos;re looking for below.
            </div>
          )}

          {/* Contact Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sw-name"
                className="block text-sm font-medium text-slate-700"
              >
                Name *
              </label>
              <input
                id="sw-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="sw-email"
                className="block text-sm font-medium text-slate-700"
              >
                Email *
              </label>
              <input
                id="sw-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="sw-phone"
                className="block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="sw-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="sw-company"
                className="block text-sm font-medium text-slate-700"
              >
                Brand / Company
              </label>
              <input
                id="sw-company"
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sw-message"
              className="block text-sm font-medium text-slate-700"
            >
              Tell us about your project
            </label>
            <textarea
              id="sw-message"
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Decoration ideas, design details, timeline, quantity needs..."
              className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (!formData.name || !formData.email)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Get My Custom Quote
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-400">
            We&apos;ll respond within 24 hours. Or call us at{' '}
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'streetwear_form' })}
              className="text-brand-600 hover:text-brand-700"
            >
              (855) 942-7636
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
