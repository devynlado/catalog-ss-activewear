'use client';

import { Cog, Building2, Package, Camera, Scissors, Palette } from 'lucide-react';

const capabilities = [
  {
    stat: '6',
    label: 'Automatic Screen Presses',
    description: 'High-volume production',
    icon: Cog,
  },
  {
    stat: '20,000',
    label: 'Sq Ft Facility',
    description: 'Full-scale production space',
    icon: Building2,
  },
  {
    stat: 'Auto',
    label: 'Folding & Bagging',
    description: 'Professional packaging',
    icon: Package,
  },
  {
    stat: 'Complete',
    label: 'Digital Dark Room',
    description: 'In-house screen imaging',
    icon: Camera,
  },
  {
    stat: 'Full',
    label: 'Embroidery Department',
    description: 'Multi-head machines',
    icon: Scissors,
  },
  {
    stat: 'Custom',
    label: 'Ink & Pantone Lab',
    description: 'Exact color matching',
    icon: Palette,
  },
];

export function BuiltForScaleLegacy() {
  return (
    <section className="bg-navy-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built for Scale
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            From 24 pieces to 24,000 — we have the production capacity 
            and equipment to handle any project size.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-brand-500/50 hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/20">
                    <Icon className="h-6 w-6 text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {item.stat}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            <span className="text-brand-400 font-semibold">Enterprise-ready infrastructure</span>
            {' '}— the same equipment used by the largest decorators in the country.
          </p>
        </div>
      </div>
    </section>
  );
}
