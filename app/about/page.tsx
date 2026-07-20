'use client';

import Link from 'next/link';
import { Users, Users2, Star, TrendingUp, Building2, Heart, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="bg-[#070131] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Custom Apparel At Scale
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
              Garment Decor specializes in factory-direct screen printing and embroidery services 
              for brands, distributors, wholesalers, resellers, and companies who need 
              professional-grade apparel without the middleman.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div className="rounded-xl bg-white p-6 text-center shadow-lg ring-1 ring-stone-200">
              <div className="text-3xl font-bold text-brand-500 sm:text-4xl">10,000+</div>
              <div className="mt-1 text-sm font-medium text-slate-600">Businesses Served</div>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-lg ring-1 ring-stone-200">
              <div className="text-3xl font-bold text-brand-500 sm:text-4xl">Millions</div>
              <div className="mt-1 text-sm font-medium text-slate-600">of Units Printed</div>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-lg ring-1 ring-stone-200">
              <div className="text-3xl font-bold text-brand-500 sm:text-4xl">50 States</div>
              <div className="mt-1 text-sm font-medium text-slate-600">Clients Nationwide</div>
            </div>
            <div className="rounded-xl bg-white p-6 text-center shadow-lg ring-1 ring-stone-200">
              <div className="text-3xl font-bold text-brand-500 sm:text-4xl">100%</div>
              <div className="mt-1 text-sm font-medium text-slate-600">Family Owned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-600">
              Trusted by Businesses Nationwide
            </h2>
            <h3 className="mt-2 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Our Story
            </h3>
            
            <div className="mt-8 space-y-6 text-slate-600 leading-relaxed">
              <p>
                Fifteen years ago, Garment Decor was born in our mom&apos;s garage as a high school project 
                with nothing more than a single press, big dreams, and a hustle mentality. What began 
                as selling t-shirts at the local swap meet quickly became a way to put food on the table.
              </p>
              
              <p>
                Believing in the motto <strong className="text-slate-900">&quot;When You Grow, We Grow&quot;</strong>, 
                we turned small wins into momentum. That mindset transformed a garage venture into a 
                thriving factory that now partners with thousands of businesses.
              </p>
              
              <p>
                And while we&apos;ve scaled, the heart of our company has never changed — we&apos;re still 
                family-owned, still hands-on, and still committed to treating every project like it&apos;s our own.
              </p>
              
              <p>
                For us, it&apos;s never just about printing. It&apos;s about solving problems, building trust, 
                and helping brands grow through custom merchandise. From product sourcing and design 
                advice to fast turnarounds when you need them most, we aim to be more than your printer — 
                <strong className="text-slate-900"> we aim to be your partner</strong>.
              </p>
              
              <p className="text-lg font-medium text-slate-900">
                Our journey proves one thing: when our clients succeed, we succeed together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-y border-stone-200 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              What Sets Us Apart
            </h2>
            <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Experts in Custom
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              We&apos;re more than printers — we&apos;re partners. Every order is crafted with care, 
              customized to your needs, and backed by the capacity to grow with you.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Partner */}
            <div className="group rounded-2xl bg-stone-50 p-8 transition-all hover:bg-brand-50 hover:ring-2 hover:ring-brand-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <Users2 className="h-7 w-7" />
              </div>
              <h4 className="mt-6 text-xl font-semibold text-slate-900">Partner</h4>
              <p className="mt-3 text-slate-600 leading-relaxed">
                An extension of your team, not just a vendor. We work alongside you to understand 
                your goals and deliver results that exceed expectations.
              </p>
            </div>

            {/* Custom */}
            <div className="group rounded-2xl bg-stone-50 p-8 transition-all hover:bg-brand-50 hover:ring-2 hover:ring-brand-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <Star className="h-7 w-7" />
              </div>
              <h4 className="mt-6 text-xl font-semibold text-slate-900">Custom</h4>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Every order made to match your vision. From color matching to placement, 
                we ensure your brand looks exactly the way you want it.
              </p>
            </div>

            {/* Scale */}
            <div className="group rounded-2xl bg-stone-50 p-8 transition-all hover:bg-brand-50 hover:ring-2 hover:ring-brand-200">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h4 className="mt-6 text-xl font-semibold text-slate-900">Scale</h4>
              <p className="mt-3 text-slate-600 leading-relaxed">
                From small runs to nationwide rollouts. Our factory has the capacity and 
                expertise to handle orders of any size without sacrificing quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                Why Garment Decor
              </h2>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Built for Businesses Like Yours
              </h3>
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
                    <h4 className="font-semibold text-slate-900">Factory Direct Pricing</h4>
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
                    <h4 className="font-semibold text-slate-900">Dedicated Account Reps</h4>
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
                    <h4 className="font-semibold text-slate-900">Family Values, Enterprise Quality</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      The personal touch of a small business with the capacity of a large operation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 ring-1 ring-stone-200">
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
              <div className="absolute -bottom-4 -right-4 rounded-xl bg-white px-6 py-4 shadow-lg ring-1 ring-stone-200">
                <p className="text-sm font-medium text-slate-600">Established</p>
                <p className="text-2xl font-bold text-brand-600">2011</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-stone-200 bg-[#070131] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Start Your Project?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Get a free quote within 24 hours. Our team is standing by to help bring your vision to life.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
