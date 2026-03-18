'use client';

import { useState } from 'react';
import { ArrowRight, Phone, Zap } from 'lucide-react';
import { PortfolioQuoteModal } from './PortfolioQuoteModal';

interface PortfolioQuoteCTAProps {
  defaultDecoration?: string;
  projectTitle: string;
}

/**
 * Sidebar CTA card — replaces the static Link to /quote with a modal trigger.
 */
export function SidebarQuoteCTA({ defaultDecoration, projectTitle }: PortfolioQuoteCTAProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl bg-slate-900 p-6 text-white">
        <h3 className="font-semibold text-lg mb-2 text-white">Start Your Project</h3>
        <p className="text-slate-300 text-sm mb-4">
          Get a quote for a similar project in under 2 hours.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Request a Quote
          <ArrowRight className="h-4 w-4" />
        </button>
        <a
          href="tel:+18559427636"
          className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <Phone className="h-4 w-4" />
          (855) 942-7636
        </a>
      </div>

      <PortfolioQuoteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultDecoration={defaultDecoration}
        projectTitle={projectTitle}
      />
    </>
  );
}

/**
 * Bottom-of-page CTA banner — replaces the static Link to /quote with a modal trigger.
 */
export function BottomQuoteCTA({ defaultDecoration, projectTitle }: PortfolioQuoteCTAProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-white" />
            <span className="text-white/90 font-medium">Average quote response: 2 hours</span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Start Your Project?
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Whether you need 50 pieces or 50,000, we&apos;ll help bring your vision to life with the
            same attention to detail.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-brand-600 shadow-lg transition-all hover:bg-stone-50"
            >
              Get Your Free Quote
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
            >
              <Phone className="h-5 w-5" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </section>

      <PortfolioQuoteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultDecoration={defaultDecoration}
        projectTitle={projectTitle}
      />
    </>
  );
}
