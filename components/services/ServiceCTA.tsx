'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Calculator } from 'lucide-react';

interface ServiceCTAProps {
  title?: string;
  subtitle?: string;
  showRushBanner?: boolean;
  serviceSlug?: string; // For context passing
}

export function ServiceCTA({
  title = "Ready to Get Started?",
  subtitle = "Request a quote and we'll respond within 24 hours.",
  showRushBanner = true,
  serviceSlug,
}: ServiceCTAProps) {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Rush Banner */}
        {showRushBanner && (
          <Link
            href="/services/rush"
            className="mb-8 flex items-center justify-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 hover:bg-amber-100 transition-colors group"
          >
            <Zap className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">
              Need it faster? Rush turnaround available — as soon as 48 hours.
            </span>
            <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
        
        {/* Main CTA */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-slate-600">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={serviceSlug ? `/contact?service=${serviceSlug}` : '/contact'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600"
              >
                Request a Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={serviceSlug ? `/pricing?service=${serviceSlug}` : '/pricing'}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <Calculator className="h-5 w-5" />
                Get Instant Estimate
              </Link>
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                Call (855) 942-7636
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
