'use client';

import Link from 'next/link';
import { ShoppingBag, Upload, PhoneCall, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Browse & Build',
    description: 'Explore our catalog of premium blanks. Add items and quantities to your quote.',
    icon: ShoppingBag,
  },
  {
    number: 2,
    title: 'Tell Us Your Vision',
    description: 'Share your artwork or describe your design. We handle the rest.',
    icon: Upload,
  },
  {
    number: 3,
    title: 'Get Your Quote',
    description: "We'll call within 24 hours with pricing, options, and guaranteed delivery date.",
    icon: PhoneCall,
  },
  {
    number: 4,
    title: 'Approve & Produce',
    description: 'Confirm your order and we start production. Track progress every step.',
    icon: CheckCircle,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Simple Process
          </p>
          <h2 className="mt-2 text-3xl font-bold text-navy-800 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Get custom decorated apparel in 4 easy steps. No hassle, no surprises — 
            just quality products delivered on time.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.number} className="relative">
                  {/* Connector Line (hidden on mobile, shown on lg) */}
                  {!isLast && (
                    <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-brand-200 to-brand-100 lg:block" />
                  )}
                  
                  <div className="relative flex flex-col items-center text-center">
                    {/* Number Circle */}
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 ring-4 ring-white">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                        <Icon className="h-6 w-6" />
                      </div>
                      {/* Step Number Badge */}
                      <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <h3 className="mt-6 text-lg font-bold text-navy-800">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center rounded-2xl bg-slate-50 p-8 sm:flex-row sm:gap-6">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-navy-800">
                Ready to start your project?
              </p>
              <p className="mt-1 text-slate-600">
                Browse our catalog and build your quote today.
              </p>
            </div>
            <Link
              href="/catalog"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl sm:mt-0"
            >
              Start Building Your Quote
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
