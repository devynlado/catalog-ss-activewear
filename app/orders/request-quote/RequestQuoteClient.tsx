'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, Pencil, Lock, FileText, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { HoneypotField } from '@/components/forms/HoneypotField';
import { TurnstileWidget } from '@/components/forms/TurnstileWidget';
import { TURNSTILE_TOKEN_FIELD } from '@/lib/turnstile';
import { getVisitorSource } from '@/lib/attribution';
import { trackGenerateLead } from '@/lib/analytics';

interface RequestQuoteClientProps {
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
}

const quantityOptions = [
  { value: '24-49', label: '24-49 pieces', estimatedValue: 150 },
  { value: '50-99', label: '50-99 pieces', estimatedValue: 200 },
  { value: '100-249', label: '100-249 pieces', estimatedValue: 400 },
  { value: '250-499', label: '250-499 pieces', estimatedValue: 750 },
  { value: '500-999', label: '500-999 pieces', estimatedValue: 1200 },
  { value: '1000+', label: '1,000+ pieces', estimatedValue: 2000 },
];

export function RequestQuoteClient({ email, name, phone, company }: RequestQuoteClientProps) {
  // Identity fields default to session values. The customer can unlock them if
  // they're requesting on behalf of someone else (procurement scenario).
  const [identityLocked, setIdentityLocked] = useState(true);
  const [identity, setIdentity] = useState({
    name: name ?? '',
    email,
    phone: phone ?? '',
    company: company ?? '',
  });

  const [quantity, setQuantity] = useState('');
  const [details, setDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null | ''>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identity.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!quantity) {
      setError('Please pick an estimated quantity so we can quote accurately.');
      return;
    }
    if (!details.trim() || details.trim().length < 10) {
      setError('Please add a brief project description (at least a sentence).');
      return;
    }

    setIsSubmitting(true);
    try {
      const formEl = e.currentTarget as HTMLFormElement;
      const honeypot = (formEl.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: identity.name || '(Existing customer)',
          email: identity.email,
          phone: identity.phone,
          company: identity.company || undefined,
          quantity,
          message: details,
          source: 'orders_inquiry',
          visitor_source: getVisitorSource(),
          website: honeypot,
          [TURNSTILE_TOKEN_FIELD]: turnstileToken ?? '',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to submit your request.');
      }

      const estimatedValue =
        quantityOptions.find((q) => q.value === quantity)?.estimatedValue ?? 300;
      trackGenerateLead({ source: 'orders_inquiry', value: estimatedValue });

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-navy-800">Request received!</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Thanks {identity.name?.split(' ')[0] || 'there'} — our team will get back to you within
          2 hours during business hours. You can also track this request under{' '}
          <a href="/orders/inquiries" className="font-medium text-brand-600 hover:text-brand-700">
            My Inquiries
          </a>
          .
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
          >
            Back to my orders
          </a>
          <a
            href="tel:+18559427636"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Phone className="h-4 w-4" />
            Or call (855) 942-7636
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy-800 sm:text-xl">Request a Quote</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tell us roughly how many pieces you need and a bit about the project — we&apos;ll
              respond within 2 hours.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            <strong className="text-slate-700">2hr</strong> avg response
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            No obligation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            Reply lands in <strong className="text-slate-700">{email}</strong>
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <HoneypotField />

        {/* Pre-filled identity block */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your details
            </p>
            <button
              type="button"
              onClick={() => setIdentityLocked((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-stone-200/60 hover:text-navy-800"
            >
              {identityLocked ? (
                <>
                  <Pencil className="h-3 w-3" />
                  Edit
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Lock
                </>
              )}
            </button>
          </div>

          {identityLocked ? (
            <dl className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              <div className="flex items-baseline gap-2">
                <dt className="w-16 shrink-0 text-xs text-slate-500">Name</dt>
                <dd className="font-medium text-navy-800">{identity.name || '—'}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-16 shrink-0 text-xs text-slate-500">Email</dt>
                <dd className="truncate font-medium text-navy-800">{identity.email}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-16 shrink-0 text-xs text-slate-500">Phone</dt>
                <dd className="font-medium text-navy-800">{identity.phone || '—'}</dd>
              </div>
              {identity.company && (
                <div className="flex items-baseline gap-2">
                  <dt className="w-16 shrink-0 text-xs text-slate-500">Company</dt>
                  <dd className="truncate font-medium text-navy-800">{identity.company}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LabeledInput
                label="Name"
                value={identity.name}
                onChange={(v) => setIdentity({ ...identity, name: v })}
                placeholder="Your name"
              />
              <LabeledInput
                label="Email *"
                type="email"
                value={identity.email}
                onChange={(v) => setIdentity({ ...identity, email: v })}
                placeholder="you@company.com"
              />
              <LabeledInput
                label="Phone"
                type="tel"
                value={identity.phone}
                onChange={(v) => setIdentity({ ...identity, phone: v })}
                placeholder="(555) 123-4567"
              />
              <LabeledInput
                label="Company"
                value={identity.company}
                onChange={(v) => setIdentity({ ...identity, company: v })}
                placeholder="Your company name"
              />
            </div>
          )}
        </div>

        {/* The two real questions */}
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-navy-800">
              Estimated quantity *
            </label>
            <select
              id="quantity"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-navy-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Pick a range…</option>
              {quantityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              A rough range is fine — we&apos;ll firm it up over email.
            </p>
          </div>

          <div>
            <label htmlFor="details" className="mb-1.5 block text-sm font-medium text-navy-800">
              Project details *
            </label>
            <textarea
              id="details"
              required
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={"What do you need? (e.g. 200 navy hoodies, 2-color front print, deadline mid-July, similar to last order)"}
              className="w-full resize-none rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">
              Decoration method, deadline, similar past orders — anything helps us quote faster.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5">
          <TurnstileWidget onTokenChange={setTurnstileToken} action="orders-inquiry" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || turnstileToken === null}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send request
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Need something quicker?{' '}
          <a href="tel:+18559427636" className="font-medium text-brand-600 hover:text-brand-700">
            Call (855) 942-7636
          </a>
        </p>
      </form>
    </div>
  );
}

function LabeledInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
