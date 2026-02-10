'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  email: string;
  phone: string;
  projectDetails: string;
  timeline: string;
  budget: string;
}

const timelineOptions = [
  { value: '', label: 'Select timeline' },
  { value: 'flexible', label: "I'm flexible" },
  { value: '2-4-weeks', label: '2-4 weeks' },
  { value: 'within-2-weeks', label: 'Within 2 weeks (rush)' },
  { value: 'exploring', label: 'Just exploring for now' },
];

const budgetOptions = [
  { value: '', label: 'Select budget (optional)' },
  { value: 'under-500', label: 'Under $500' },
  { value: '500-2000', label: '$500 - $2,000' },
  { value: '2000-5000', label: '$2,000 - $5,000' },
  { value: '5000-plus', label: '$5,000+' },
  { value: 'not-sure', label: 'Not sure yet' },
];

export function ProjectInquiryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    projectDetails: '',
    timeline: '',
    budget: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format the message to include all details
      const formattedMessage = `
PROJECT DETAILS:
${formData.projectDetails}

TIMELINE: ${timelineOptions.find(t => t.value === formData.timeline)?.label || 'Not specified'}
BUDGET: ${budgetOptions.find(b => b.value === formData.budget)?.label || 'Not specified'}
      `.trim();

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formattedMessage,
          service: 'Project Inquiry',
          source: 'services_page_inquiry_form',
          quantity: formData.budget, // Use budget field for quantity tracking
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        projectDetails: '',
        timeline: '',
        budget: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 bg-white rounded-2xl border border-green-200 shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-navy-800 mb-2">
              We Got Your Project Details!
            </h3>
            <p className="text-slate-600 mb-4">
              Our team will review your project and get back to you within 2 hours during business hours 
              with recommendations and a free mockup.
            </p>
            <p className="text-sm text-slate-500">
              Questions? Call us at{' '}
              <a href="tel:8559427636" className="text-brand-600 font-medium hover:underline">
                (855) 942-7636
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl mb-4">
              Not Sure Where to Start?
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Tell us about your project and we&apos;ll recommend the best approach — plus send you a 
              free mockup within 24 hours.
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 mt-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-navy-800">Expert Recommendations</p>
                  <p className="text-sm text-slate-600">
                    We&apos;ll match your project to the right decoration method
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 mt-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-navy-800">Free Mockup Included</p>
                  <p className="text-sm text-slate-600">
                    See your design on the product before committing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 mt-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-navy-800">Detailed Quote</p>
                  <p className="text-sm text-slate-600">
                    Transparent pricing with no hidden fees
                  </p>
                </div>
              </div>
            </div>

            {/* Response time */}
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-stone-100 rounded-lg px-4 py-3">
              <Clock className="h-4 w-4 text-brand-500" />
              <span>We typically respond within <strong>2 hours</strong> during business hours</span>
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <form 
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8"
            >
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                    placeholder="John Smith"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                    placeholder="john@company.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Project Details */}
                <div>
                  <label htmlFor="projectDetails" className="block text-sm font-medium text-slate-700 mb-1.5">
                    About Your Project <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="projectDetails"
                    name="projectDetails"
                    required
                    rows={4}
                    value={formData.projectDetails}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none"
                    placeholder="Example: 200 t-shirts for a company event in March. We have a 2-color logo and want something soft and comfortable."
                  />
                </div>

                {/* Timeline & Budget Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Timeline */}
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-1.5">
                      When do you need them?
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className={cn(
                        "w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors appearance-none bg-white",
                        !formData.timeline && "text-slate-400"
                      )}
                    >
                      {timelineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget */}
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Estimated budget
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className={cn(
                        "w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors appearance-none bg-white",
                        !formData.budget && "text-slate-400"
                      )}
                    >
                      {budgetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all",
                    isSubmitting
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Get My Free Quote
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Trust text */}
                <p className="text-center text-xs text-slate-500">
                  No spam, no pressure — just helpful recommendations.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
