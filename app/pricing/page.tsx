'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Phone, Clock, Shield, ArrowRight } from 'lucide-react';
import { PricingCalculator } from '@/components/tools/PricingCalculator';

// Map URL params to calculator tabs
const serviceMapping: Record<string, 'screen-printing' | 'embroidery' | 'digital' | 'jumbo' | 'finishing'> = {
  'screen-printing': 'screen-printing',
  'embroidery': 'embroidery',
  'digital-screen-printing': 'digital',
  'digital': 'digital',
  'jumbo-screen-printing': 'jumbo',
  'jumbo': 'jumbo',
  'puff-screen-printing': 'screen-printing', // Puff uses screen printing pricing + surcharge
  'simulated-process': 'screen-printing', // Simulated uses screen printing pricing
  'retail-finishing': 'finishing',
  'finishing': 'finishing',
};

function PricingContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const defaultService = serviceParam ? serviceMapping[serviceParam] || 'screen-printing' : 'screen-printing';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Instant Pricing Calculator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Get an instant estimate for your custom apparel project. 
              Adjust quantity, colors, and options to see real-time pricing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                <Shield className="h-4 w-4" />
                Wholesale Pricing
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                <Clock className="h-4 w-4" />
                50 Piece Minimum
              </span>
              <span className="inline-flex items-center gap-2 bg-amber-400/90 rounded-full px-4 py-2 text-amber-950 font-medium">
                Garments Not Included
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <PricingCalculator defaultService={defaultService} />
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">What's Included in Your Quote</h2>
            <p className="mt-2 text-slate-600">Here's what you can expect when you work with us</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Free Art Setup',
                description: 'Basic artwork preparation and color separation included in setup fees.',
              },
              {
                title: 'Quality Guarantee',
                description: 'Every piece is inspected before shipping. We stand behind our work.',
              },
              {
                title: 'Fast Turnaround',
                description: 'Standard 10 business days. Rush options available.',
              },
              {
                title: 'No Hidden Fees',
                description: 'The price you see is the price you pay. No surprises.',
              },
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 mx-auto mb-4">
                  <span className="text-lg font-bold">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Costs Reference */}
      <section className="py-12 lg:py-16 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">Additional Options & Fees</h2>
            <p className="mt-2 text-slate-600">These may apply depending on your project requirements</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Screen Printing Extras */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Screen Printing</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600">Setup per color</span>
                  <span className="font-medium">$30</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Jumbo setup per color</span>
                  <span className="font-medium">$50</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Fleece surcharge</span>
                  <span className="font-medium">+$1.00/pc</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Puff ink</span>
                  <span className="font-medium">+$1.00/pc</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Metallic ink</span>
                  <span className="font-medium">+$0.50/pc</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">PMS color match</span>
                  <span className="font-medium">$30</span>
                </li>
              </ul>
            </div>

            {/* Digital Extras */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Digital Screen Printing</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600">Setup fee</span>
                  <span className="font-medium">$100</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Fleece surcharge</span>
                  <span className="font-medium">+$1.00/pc</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Discharge print</span>
                  <span className="font-medium">+$1.50/pc</span>
                </li>
              </ul>
            </div>

            {/* Finishing Minimums */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Finishing Services</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600">Printed neck tags (min)</span>
                  <span className="font-medium">$200</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Sewn woven labels (min)</span>
                  <span className="font-medium">$300</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Cut-away tag removal</span>
                  <span className="font-medium">Surcharge</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-navy-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-slate-300">
              Have questions about pricing? Our team is here to help.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600"
              >
                Request Detailed Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/20"
              >
                <Phone className="h-5 w-5" />
                Call (855) 942-7636
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading pricing calculator...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
