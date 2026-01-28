'use client';

import { Factory, Music, Building2, Truck } from 'lucide-react';

const audiences = [
  {
    title: 'Contract Decorators',
    description: 'White-label decoration services for print shops and fulfillment centers',
    icon: Factory,
  },
  {
    title: 'Merch & Touring Artists',
    description: 'Tour merch, band tees, and artist collaborations with fast turnaround',
    icon: Music,
  },
  {
    title: 'Companies & Uniforms',
    description: 'Corporate apparel, employee uniforms, and branded workwear',
    icon: Building2,
  },
  {
    title: 'Distributors',
    description: 'Bulk orders and wholesale decoration for resellers and promo companies',
    icon: Truck,
  },
];

export function WhoWeServiceLegacy() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
            Who We Work With
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy-800 sm:text-3xl">
            Trusted by Businesses of All Sizes
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-navy-800">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {audience.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
