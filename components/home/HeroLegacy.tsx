'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, TrendingUp, Clock } from 'lucide-react';
import { PhoneButton } from '@/components/ui/PhoneButton';

export function HeroLegacy() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[500px] items-center gap-8 py-10 sm:min-h-[600px] sm:gap-12 sm:py-16 lg:grid-cols-2 lg:py-24">
          {/* Left Content */}
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              Southern California&apos;s #1 Decorator
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-navy-800 sm:text-5xl lg:text-6xl">
              Custom Apparel{' '}
              <span className="text-brand-500">Decoration</span>{' '}
              Experts
            </h1>
            
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
              Screen printing, embroidery & premium blank apparel — delivered when you need it. 
              Starting at just 50 pieces (mix sizes, colors & styles!), build your quote in minutes.
            </p>
            
            <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
              >
                Start Your Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <PhoneButton 
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy-800 px-6 py-3.5 text-base font-semibold text-navy-800 transition-all hover:bg-navy-800 hover:text-white"
              />
            </div>
            
            {/* Quick Stats - hidden on mobile for cleaner above-the-fold */}
            <div className="mt-10 hidden gap-6 border-t border-slate-200 pt-6 sm:flex">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-navy-800">1M+</p>
                  <p className="text-xs text-slate-500">Shirts/Year</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-bold text-navy-800">4.8</p>
                    <p className="text-xs text-slate-500">(185)</p>
                  </div>
                  <p className="text-xs text-slate-500">Reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-navy-800">2hr</p>
                  <p className="text-xs text-slate-500">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Image - Screen Printing Process */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-navy-800/10 to-brand-600/20 animate-gradient-slow"></div>
              
              {/* Stock photo - Screen printing process */}
              <Image
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972&auto=format&fit=crop"
                alt="Screen printing process - custom apparel decoration"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-transparent"></div>
              
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-xl bg-white/95 backdrop-blur-sm p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500">
                      <span className="text-lg font-bold text-white">2hr</span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy-800">Average Quote Response</p>
                      <p className="text-sm text-slate-500">25,000+ quotes delivered yearly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-500/10 animate-pulse-slow"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-navy-800/5"></div>
          </div>
        </div>
      </div>
      
      {/* Mobile stats bar - shows on mobile only */}
      <div className="border-t border-slate-200 bg-slate-50 py-4 sm:hidden">
        <div className="mx-auto flex max-w-7xl justify-around px-4">
          <div className="text-center">
            <p className="text-xl font-bold text-navy-800">1M+</p>
            <p className="text-xs text-slate-500">Shirts/Year</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl font-bold text-navy-800">4.8</p>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500">185 Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-navy-800">2hr</p>
            <p className="text-xs text-slate-500">Avg Response</p>
          </div>
        </div>
      </div>
    </section>
  );
}
