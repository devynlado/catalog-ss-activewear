'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, Phone, MessageCircle, User } from 'lucide-react';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';

interface ServiceQuoteFormProps {
  service: string;
  serviceName: string;
  headline?: string;
  description?: string;
}

export function ServiceQuoteForm({
  service,
  serviceName,
  headline = "Get a Free Quote",
  description = "Tell us about your project and we'll get back to you within 2 hours.",
}: ServiceQuoteFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service: serviceName,
          source: `service_${service}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Track conversion in GA4
      trackGenerateLead({
        source: `service_${service}`,
        value: 300,
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-stone-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
              {headline}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {description}
            </p>

            {/* Trust Indicators */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <MessageCircle className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">Free Consultation</h3>
                  <p className="text-sm text-slate-600">
                    No obligation — just honest advice on your project
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <User className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">Your Dedicated Rep</h3>
                  <p className="text-sm text-slate-600">
                    Work 1-on-1 with an expert who learns your brand
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <Phone className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">Prefer to Talk?</h3>
                  <p className="text-sm text-slate-600">
                    Call us at{' '}
                    <a
                      href="tel:+18559427636"
                      onClick={() => trackPhoneClick({ source: `service_${service}_sidebar` })}
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      (855) 942-7636
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            {isSubmitted ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-lg border border-stone-200">
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
                    onClick={() => trackPhoneClick({ source: `service_${service}_confirmation` })}
                    className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" />
                    Call us now: (855) 942-7636
                  </a>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-stone-200"
              >
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="quote-name" className="block text-sm font-medium text-navy-800 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="quote-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="quote-email" className="block text-sm font-medium text-navy-800 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="quote-email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="quote-phone" className="block text-sm font-medium text-navy-800 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="quote-phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="quote-message" className="block text-sm font-medium text-navy-800 mb-1">
                      Project Details
                    </label>
                    <textarea
                      id="quote-message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project — quantity, timeline, design ideas..."
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
                  <span>✓ Free consultation</span>
                  <span>✓ Dedicated rep</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
