'use client';

/**
 * /quote — project-form lead capture.
 *
 * This page replaces the previous cart-first flow which sent visitors to
 * /catalog and lost them to checkout. The customer instead describes their
 * project(s) inline: where the blanks come from, which decoration method,
 * and the per-method configuration that mirrors /pricing. Up to
 * `MAX_PROJECTS_PER_QUOTE` project blocks per submission.
 *
 * The submission POSTs to /api/quote/submit which writes to the `quotes`
 * table (feeding /admin/quotes) and emails the team using the same inbox
 * as the LP forms.
 *
 * The existing quote store and QuoteDrawer elsewhere on the site are left
 * intact; their "Review & Submit Quote" link lands here, and any items
 * held in the drawer are surfaced as a small context banner rather than
 * gating the form.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  Info,
  Mail,
  Phone,
  Plus,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HoneypotField } from '@/components/forms/HoneypotField';
import { TurnstileWidget } from '@/components/forms/TurnstileWidget';
import { TURNSTILE_TOKEN_FIELD } from '@/lib/turnstile';
import { trackQuoteFormSubmit } from '@/lib/analytics';
import {
  MAX_PROJECTS_PER_QUOTE,
  SERVICE_QUERY_MAPPING,
  type QuoteDecorationMethod,
} from '@/lib/quote-form-options';
import {
  QuoteProjectForm,
  makeEmptyProject,
  type QuoteProject,
  type QuoteProjectErrors,
} from '@/components/quote/QuoteProjectForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Approximate a piece count from a quantity tier by taking the tier's lower
// bound. Used only for GA4 event value (`totalUnits`) — the sales team
// treats the tier itself as the source of truth.
function estimatePiecesFromTier(tier: string): number {
  if (!tier) return 0;
  const first = tier.split('-')[0]?.replace(/\D/g, '');
  const n = parseInt(first ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

function estimatePiecesForProject(p: QuoteProject): number {
  if (p.decorationMethod === 'finishing') return p.finishingQuantity;
  return estimatePiecesFromTier(p.quantityTier);
}

// Field-level validation for one project. Returns an errors object; empty
// means the project is valid. Only enforces the fields the customer must
// supply — everything else has a working default.
function validateProject(p: QuoteProject): QuoteProjectErrors {
  const errors: QuoteProjectErrors = {};

  if (!p.blankSource) {
    errors.blankSource = 'Please tell us where the blanks come from.';
  } else if (
    p.blankSource === 'own' &&
    !p.blankOwnDescription.trim()
  ) {
    errors.blankOwnDescription =
      'Please describe your blanks so we can plan the decoration.';
  } else if (
    p.blankSource === 'catalog' &&
    !p.catalogCategory &&
    !p.catalogProduct
  ) {
    errors.catalogCategory =
      'Pick a category or search a specific product.';
  }

  if (!p.decorationMethod) {
    errors.decorationMethod = 'Pick a decoration method.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Page shell (Suspense wrapper for useSearchParams)
// ---------------------------------------------------------------------------

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 text-slate-600">Loading quote form…</p>
          </div>
        </div>
      }
    >
      <QuotePageContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Actual page content
// ---------------------------------------------------------------------------

function QuotePageContent() {
  const searchParams = useSearchParams();

  // Preselect Project 1's decoration method from ?service=… so marketing
  // links like /quote?service=embroidery deep-link correctly.
  const initialMethod = useMemo<QuoteDecorationMethod | undefined>(() => {
    const raw = searchParams.get('service');
    if (!raw) return undefined;
    return SERVICE_QUERY_MAPPING[raw];
  }, [searchParams]);

  const [projects, setProjects] = useState<QuoteProject[]>(() => [
    makeEmptyProject(initialMethod),
  ]);
  const [projectErrors, setProjectErrors] = useState<QuoteProjectErrors[]>([
    {},
  ]);

  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    eventDate: '',
    message: '',
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>(
    {},
  );

  const [turnstileToken, setTurnstileToken] = useState<string | null | ''>(
    null,
  );

  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  const updateProject = useCallback(
    (index: number, updates: Partial<QuoteProject>) => {
      setProjects((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
      });
      // Optimistically clear that project's errors on any change — the
      // customer is engaging with the field, so keeping stale red text
      // just adds noise.
      setProjectErrors((prev) => {
        if (!prev[index] || Object.keys(prev[index]).length === 0) return prev;
        const next = [...prev];
        next[index] = {};
        return next;
      });
    },
    [],
  );

  const addProject = () => {
    if (projects.length >= MAX_PROJECTS_PER_QUOTE) return;
    setProjects((prev) => [...prev, makeEmptyProject()]);
    setProjectErrors((prev) => [...prev, {}]);
  };

  const removeProject = (index: number) => {
    if (projects.length <= 1) return;
    setProjects((prev) => prev.filter((_, i) => i !== index));
    setProjectErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
    if (contactErrors[name]) {
      setContactErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const nextContactErrors: Record<string, string> = {};
    if (!contact.name.trim()) nextContactErrors.name = 'Name is required.';
    if (!contact.email.trim()) {
      nextContactErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      nextContactErrors.email = 'Please enter a valid email address.';
    }
    if (!contact.phone.trim()) nextContactErrors.phone = 'Phone is required.';

    const nextProjectErrors = projects.map(validateProject);

    setContactErrors(nextContactErrors);
    setProjectErrors(nextProjectErrors);

    const projectsClean = nextProjectErrors.every(
      (e) => Object.keys(e).length === 0,
    );
    return Object.keys(nextContactErrors).length === 0 && projectsClean;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to the first invalid field's project so the customer can
      // see the red text without having to search for it.
      const firstBadIndex = projects.findIndex(
        (_, i) => projectErrors[i] && Object.keys(projectErrors[i]).length > 0,
      );
      if (firstBadIndex >= 0) {
        document
          .getElementById(`quote-project-${firstBadIndex}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setSubmitState('submitting');
    setSubmitError(null);

    try {
      const formEl = e.currentTarget as HTMLFormElement;
      const honeypotInput = formEl.elements.namedItem(
        'website',
      ) as HTMLInputElement | null;

      const response = await fetch('/api/quote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects,
          contact: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company || undefined,
            message: contact.message || undefined,
          },
          eventDate: contact.eventDate || null,
          website: honeypotInput?.value ?? '',
          [TURNSTILE_TOKEN_FIELD]: turnstileToken ?? '',
          submittedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }

      // GA4 lead event. We roll up the summary because trackQuoteFormSubmit
      // expects scalar fields; the sales team sees the full breakdown in
      // the email and /admin/quotes.
      const totalUnits = projects.reduce(
        (sum, p) => sum + estimatePiecesForProject(p),
        0,
      );
      const decorationTypes = Array.from(
        new Set(
          projects
            .map((p) => p.decorationMethod)
            .filter((m): m is QuoteDecorationMethod => Boolean(m)),
        ),
      ).join(',');
      trackQuoteFormSubmit({
        totalItems: projects.length,
        totalUnits,
        decorationType: decorationTypes || 'unknown',
      });

      setQuoteId(data.quoteId ?? null);
      setSubmitState('success');
    } catch (err) {
      console.error('Error submitting quote:', err);
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Failed to submit quote. Please try again.',
      );
      setSubmitState('error');
    }
  };

  // Focus back to top on success so the confirmation is visible.
  useEffect(() => {
    if (submitState === 'success') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitState]);

  // ---------- Success state ----------
  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Quote Request Received
            </h1>
            <p className="mt-3 text-slate-600">
              Thanks {contact.name.split(' ')[0] || 'there'} — we've got your
              details and our team will get back to you within 2 hours during
              business hours.
            </p>
            {quoteId && (
              <p className="mt-3 text-sm text-slate-500">
                Reference: <span className="font-medium">{quoteId}</span>
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              What would you like to do next?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/portfolio"
                className="group flex items-center gap-3 rounded-xl border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">See our work</p>
                  <p className="text-sm text-slate-500">
                    Recent projects & case studies
                  </p>
                </div>
              </Link>
              <Link
                href="/catalog"
                className="group flex items-center gap-3 rounded-xl border border-stone-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Browse blanks</p>
                  <p className="text-sm text-slate-500">
                    5,000+ garment options
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-stone-100 p-4 text-center">
            <p className="text-sm text-slate-600">
              Need it faster? Call{' '}
              <a
                href="tel:+18559427636"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                (855) 942-7636
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Main form ----------
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Trust bar (mirrors the LP + previous /quote page for consistency) */}
      <div className="bg-navy-800 py-2.5 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:gap-8 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-400" />
              <span>
                <strong>2hr</strong> avg response
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span>
                <strong>1M+</strong> shirts/year
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>
                <strong>4.8</strong> stars (185 reviews)
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Sample before production</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Request a Quote
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Tell us about your project. We will get back with best offer for
            you within 2 hours.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <HoneypotField />

        {/* --------- Contact --------- */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Contact Info
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              We'll use this to send you the quote.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                name="name"
                value={contact.name}
                onChange={handleContactChange}
                error={contactErrors.name}
                placeholder="Jane Smith"
                required
              />
              <Input
                label="Company (Optional)"
                name="company"
                value={contact.company}
                onChange={handleContactChange}
                placeholder="Company or organization"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                name="email"
                type="email"
                value={contact.email}
                onChange={handleContactChange}
                error={contactErrors.email}
                placeholder="you@company.com"
                required
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={contact.phone}
                onChange={handleContactChange}
                error={contactErrors.phone}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Need-by date (optional)
              </label>
              <input
                type="date"
                name="eventDate"
                value={contact.eventDate}
                onChange={handleContactChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Have a deadline? We'll prioritize your quote.
              </p>
            </div>
          </div>
        </div>

        {/* --------- Projects --------- */}
        <div className="mt-8 space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Project Details
            </h2>
            <p className="text-xs text-slate-500">
              {projects.length} of {MAX_PROJECTS_PER_QUOTE}
            </p>
          </div>

          {projects.map((project, index) => (
            <div key={index} id={`quote-project-${index}`}>
              <QuoteProjectForm
                project={project}
                index={index}
                onChange={(updates) => updateProject(index, updates)}
                onRemove={
                  projects.length > 1
                    ? () => removeProject(index)
                    : undefined
                }
                errors={projectErrors[index]}
              />
            </div>
          ))}

          {projects.length < MAX_PROJECTS_PER_QUOTE && (
            <button
              type="button"
              onClick={addProject}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-white px-6 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add another project
            </button>
          )}
        </div>

        {/* --------- Additional notes + submit --------- */}
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Anything else?
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Optional — timeline pressures, art references, budget target, etc.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <textarea
              name="message"
              value={contact.message}
              onChange={handleContactChange}
              rows={3}
              placeholder="Any special requirements or questions…"
              className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />

            {submitState === 'error' && submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <TurnstileWidget
              onTokenChange={setTurnstileToken}
              action="quote"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={submitState === 'submitting'}
              disabled={turnstileToken === null}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Quote Request
            </Button>

            <p className="text-center text-xs text-slate-500">
              <Mail className="mr-1 inline h-3 w-3" />
              We reply by email within 2 hours during business hours.
            </p>
          </div>
        </div>

        {/* Emergency-CTA card mirrors the previous /quote page's tone. */}
        <div className="mt-8 rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 p-6 text-white">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold">Prefer to talk?</h3>
              <p className="mt-1 text-sm text-slate-300">
                Our team has helped 25,000+ customers — we're happy to help
                over the phone too.
              </p>
            </div>
            <a
              href="tel:+18559427636"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Phone className="h-4 w-4" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
