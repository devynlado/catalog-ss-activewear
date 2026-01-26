'use client';

import Image from 'next/image';
import { Building2, Users, Heart } from 'lucide-react';
import { warehouseImages } from '@/lib/service-images';

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

          {/* Facility Image */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <Image
                src={warehouseImages.facility.src}
                alt={warehouseImages.facility.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay with location info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-lg font-semibold">Montclair, California</p>
                <p className="mt-1 text-sm text-white/80">
                  Our 25,000 sq ft production facility
                </p>
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
