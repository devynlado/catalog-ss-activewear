'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, Phone, MessageCircle, User, Calendar } from 'lucide-react';
import { trackGenerateLead, trackPhoneClick } from '@/lib/analytics';

export function LiveEventForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventName: '',
    eventDate: '',
    eventLocation: '',
    expectedAttendance: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Build the message with event details
    const fullMessage = `
Event: ${formData.eventName}
Date: ${formData.eventDate}
Location: ${formData.eventLocation}
Expected Attendance: ${formData.expectedAttendance}

Additional Details:
${formData.message || 'None provided'}
    `.trim();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: fullMessage,
          service: 'Live Screen Printing',
          source: 'service_live-screen-printing',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Track conversion in GA4
      trackGenerateLead({
        source: 'service_live-screen-printing',
        value: 500, // Higher value for event inquiries
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="quote-form" className="bg-stone-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
              Tell Us About Your Event
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Share your event details and we'll put together a custom quote. Most quotes go out within a few hours.
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
                    We'll walk you through what to expect and help you plan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <User className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">Full-Service Setup</h3>
                  <p className="text-sm text-slate-600">
                    We bring everything—equipment, staff, and blank t-shirts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                  <Calendar className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">Flexible Scheduling</h3>
                  <p className="text-sm text-slate-600">
                    Single day, multi-day, or recurring events—we're flexible
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
                      onClick={() => trackPhoneClick({ source: 'service_live-screen-printing_sidebar' })}
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
                <h3 className="text-xl font-bold text-navy-800 mb-2">Request Received!</h3>
                <p className="text-slate-600 mb-6">
                  We'll review your event details and send over a custom quote within a few hours.
                </p>
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Want to discuss your event now?</p>
                  <a
                    href="tel:+18559427636"
                    onClick={() => trackPhoneClick({ source: 'service_live-screen-printing_confirmation' })}
                    className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" />
                    Call us: (855) 942-7636
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
                    <label htmlFor="live-name" className="block text-sm font-medium text-navy-800 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="live-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email & Phone - Side by side on larger screens */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="live-email" className="block text-sm font-medium text-navy-800 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="live-email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="live-phone" className="block text-sm font-medium text-navy-800 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="live-phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Event Name */}
                  <div>
                    <label htmlFor="live-event-name" className="block text-sm font-medium text-navy-800 mb-1">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      id="live-event-name"
                      required
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      placeholder="Annual Sales Conference, Trade Show, etc."
                    />
                  </div>

                  {/* Event Date & Location */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="live-event-date" className="block text-sm font-medium text-navy-800 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="text"
                        id="live-event-date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="March 15, 2026 or TBD"
                      />
                    </div>
                    <div>
                      <label htmlFor="live-event-location" className="block text-sm font-medium text-navy-800 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        id="live-event-location"
                        required
                        value={formData.eventLocation}
                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="City or venue name"
                      />
                    </div>
                  </div>

                  {/* Expected Attendance */}
                  <div>
                    <label htmlFor="live-attendance" className="block text-sm font-medium text-navy-800 mb-1">
                      Expected Attendance *
                    </label>
                    <select
                      id="live-attendance"
                      required
                      value={formData.expectedAttendance}
                      onChange={(e) => setFormData({ ...formData, expectedAttendance: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                    >
                      <option value="">Select expected attendance</option>
                      <option value="50-100">50-100 people</option>
                      <option value="100-250">100-250 people</option>
                      <option value="250-500">250-500 people</option>
                      <option value="500-1000">500-1,000 people</option>
                      <option value="1000+">1,000+ people</option>
                    </select>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label htmlFor="live-message" className="block text-sm font-medium text-navy-800 mb-1">
                      Additional Details
                    </label>
                    <textarea
                      id="live-message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors resize-none"
                      placeholder="Anything else we should know? Number of designs, event schedule, etc."
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
                        Get My Event Quote
                      </>
                    )}
                  </button>
                </div>

                {/* Trust indicators below form */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span>✓ No obligation</span>
                  <span>✓ Custom quote</span>
                  <span>✓ CA, AZ, NV</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
