'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { trackContactFormSubmit, trackPhoneClick, trackContactEmailClick, trackContactLocationClick } from '@/lib/analytics';

// Service name mapping for pre-filling the message
const serviceNames: Record<string, string> = {
  'screen-printing': 'Screen Printing',
  'embroidery': 'Embroidery',
  'digital-screen-printing': 'Digital Screen Printing',
  'jumbo-screen-printing': 'Jumbo Screen Printing',
  'puff-screen-printing': 'Puff Screen Printing',
  'simulated-process': 'Simulated Process Printing',
  'retail-finishing': 'Retail Finishing',
  'rush': 'Rush Turnaround',
};

/** Get source page path from document.referrer for CTA attribution (same-origin only). */
function getContactSourcePage(): string {
  if (typeof document === 'undefined' || !document.referrer) return '';
  try {
    const u = new URL(document.referrer);
    const siteHost = typeof window !== 'undefined' ? window.location.host : '';
    if (u.origin === (typeof window !== 'undefined' ? window.location.origin : '') || u.host === siteHost) {
      return u.pathname || '/';
    }
    return ''; // external referrer: no path
  } catch {
    return '';
  }
}

// Inner component that uses useSearchParams
function ContactForm() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const [sourcePage, setSourcePage] = useState('');

  useEffect(() => {
    setSourcePage(getContactSourcePage());
  }, []);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pre-fill message if coming from a service page
  useEffect(() => {
    if (serviceParam && serviceNames[serviceParam]) {
      setFormState(prev => ({
        ...prev,
        message: `I'm interested in ${serviceNames[serviceParam]} services.\n\n`,
      }));
    }
  }, [serviceParam]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          service: serviceParam ? serviceNames[serviceParam] : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Track successful form submission
      trackContactFormSubmit({
        service: serviceParam ? serviceNames[serviceParam] : undefined,
        hasPhone: !!formState.phone,
        hasCompany: !!formState.company,
        contact_source_page: sourcePage || '(direct)',
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="bg-[#070131] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Let&apos;s Talk Custom Apparel
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Whether you&apos;re a first-time buyer or a seasoned distributor, our team is here to help 
              bring your vision to life. Reach out today.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left Column: Form + What Happens Next */}
            <div className="space-y-6">
              {/* Contact Form */}
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Message Sent!</h3>
                  <p className="mt-2 text-slate-600">
                    Thank you for reaching out. A member of our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormState({ name: '', email: '', phone: '', company: '', message: '' });
                    }}
                    className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-slate-900">Send Us a Message</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formState.name}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formState.email}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formState.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formState.company}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          placeholder="Your Company"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                        How Can We Help? *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formState.message}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder="Tell us about your project, questions, or how we can assist you..."
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

              {/* What Happens Next - fills space below form */}
              <div className="rounded-xl bg-stone-50 p-6 ring-1 ring-stone-200">
                <h3 className="font-semibold text-slate-900 mb-4">What Happens Next?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Submit Your Message</p>
                      <p className="text-sm text-slate-500">We receive it instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">We Respond Fast</p>
                      <p className="text-sm text-slate-500">Average response: 2 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Get Your Solution</p>
                      <p className="text-sm text-slate-500">Quote, answers, or next steps</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info - Right Column */}
            <div className="space-y-6">
              {/* Contact Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {/* Phone */}
                <a
                  href="tel:+18559427636"
                  onClick={() => trackPhoneClick({ source: 'contact_page', contact_source_page: sourcePage || '(direct)' })}
                  className="group flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition-all hover:shadow-md hover:ring-brand-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Phone</h3>
                    <p className="mt-0.5 text-sm text-slate-600">(855) 942-7636</p>
                    <p className="mt-1 text-xs text-slate-500">Mon-Fri, 8am-5pm PST</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:sales@garmentdecor.com"
                  onClick={() => trackContactEmailClick({ contact_source_page: sourcePage || undefined })}
                  className="group flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition-all hover:shadow-md hover:ring-brand-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email</h3>
                    <p className="mt-0.5 text-sm text-slate-600">sales@garmentdecor.com</p>
                    <p className="mt-1 text-xs text-slate-500">We respond within 24 hours</p>
                  </div>
                </a>

                {/* Address */}
                <a
                  href="https://www.google.com/maps?q=4778+W+Mission+Blvd+Montclair+CA+91762"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackContactLocationClick({ contact_source_page: sourcePage || '(direct)' })}
                  className="group flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition-all hover:shadow-md hover:ring-brand-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Location</h3>
                    <p className="mt-0.5 text-sm text-slate-600">
                      4778 W Mission Blvd<br />
                      Montclair, CA 91762
                    </p>
                  </div>
                </a>

                {/* Hours */}
                <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Business Hours</h3>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                      <p>Mon - Fri: 8:00am - 5:00pm</p>
                      <p>Sat - Sun: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Embed - Regional view showing Southern California */}
              <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d423286.27405770525!2d-118.69192113701154!3d34.02016130653294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c334e72ab19de5%3A0x70e78e78f96d29e9!2s4778%20W%20Mission%20Blvd%2C%20Montclair%2C%20CA%2091762!5e0!3m2!1sen!2sus!4v1705959600000!5m2!1sen!2sus"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Garment Decor Location - Southern California"
                  className="grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>

              {/* Quick Note */}
              <div className="rounded-xl bg-brand-50 p-5 ring-1 ring-brand-100">
                <h3 className="font-semibold text-brand-900">Will Call Available</h3>
                <p className="mt-1 text-sm text-brand-700">
                  Need to pick up your order in person? Our will call service is available during business hours. 
                  Just let us know when you&apos;ll be stopping by!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Loading fallback for the form
function ContactFormFallback() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-stone-200 rounded mb-4"></div>
        <div className="h-4 w-64 bg-stone-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-stone-200 rounded"></div>
          <div className="h-10 bg-stone-200 rounded"></div>
          <div className="h-32 bg-stone-200 rounded"></div>
          <div className="h-12 bg-stone-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Main page component that wraps ContactForm in Suspense
export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50">
        <section className="bg-[#070131] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Let&apos;s Talk Custom Apparel
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                Whether you&apos;re a first-time buyer or a seasoned distributor, our team is here to help 
                bring your vision to life. Reach out today.
              </p>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <ContactFormFallback />
              <div className="space-y-6">
                <div className="h-64 bg-stone-100 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    }>
      <ContactForm />
    </Suspense>
  );
}
