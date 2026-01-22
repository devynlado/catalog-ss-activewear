'use client';

import { Building2, Users, Heart } from 'lucide-react';

export function TrustSignals() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Why Garment Decor
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Built for Businesses Like Yours
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Whether you&apos;re a startup launching your first merch line or an established 
              distributor managing dozens of accounts, we have the expertise and infrastructure 
              to support your growth.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Factory Direct Pricing</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    No middlemen, no markups. You work directly with the production team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Dedicated Account Reps</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    One point of contact who knows your business and your preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Family Values, Enterprise Quality</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    The personal touch of a small business with the capacity of a large operation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 ring-1 ring-slate-200">
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-semibold text-brand-900">Montclair, California</p>
                  <p className="mt-1 text-sm text-brand-700">
                    Our 25,000 sq ft production facility
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 rounded-xl bg-white px-6 py-4 shadow-lg ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-600">Established</p>
              <p className="text-2xl font-bold text-brand-600">2011</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
