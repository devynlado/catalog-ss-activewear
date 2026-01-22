'use client';

import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="bg-navy-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Your Project?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Add items to your quote and we'll get back to you within 24 hours 
            with pricing and turnaround time.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 hover:shadow-xl"
            >
              Start Building Your Quote
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
              Call Us Now
            </a>
          </div>
          
          <p className="mt-8 text-sm text-slate-400">
            Questions? Call us at{' '}
            <a href="tel:+18559427636" className="text-brand-400 hover:text-brand-300">
              (855) 942-7636
            </a>
            {' '}— Average wait time: 10-30 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
