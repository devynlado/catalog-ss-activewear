'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[600px] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          {/* Left Content */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600">
              <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
              Southern California's #1 Decorator
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-navy-800 sm:text-5xl lg:text-6xl">
              Custom Apparel{' '}
              <span className="text-brand-500">Decoration</span>{' '}
              Experts
            </h1>
            
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Screen printing, embroidery & premium blank apparel — delivered when you need it. 
              Starting at just 50 pieces (mix sizes, colors & styles!), build your quote in minutes.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
              >
                Start Your Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy-800 px-6 py-3.5 text-base font-semibold text-navy-800 transition-all hover:bg-navy-800 hover:text-white"
              >
                <Phone className="h-5 w-5" />
                (855) 942-7636
              </a>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-12 flex gap-8 border-t border-slate-200 pt-8">
              <div>
                <p className="text-3xl font-bold text-navy-800">15+</p>
                <p className="text-sm text-slate-500">Years Experience</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-800">4.8★</p>
                <p className="text-sm text-slate-500">Google Rating</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-800">48hr</p>
                <p className="text-sm text-slate-500">Rush Available</p>
              </div>
            </div>
          </div>
          
          {/* Right Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200">
              {/* Placeholder - replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-white">
                    <span className="text-3xl font-bold">GD</span>
                  </div>
                  <p className="text-sm text-brand-600">Add hero image to</p>
                  <p className="text-xs text-brand-500">/public/images/hero.jpg</p>
                </div>
              </div>
              
              {/* Uncomment when you have an image:
              <Image
                src="/images/hero.jpg"
                alt="Custom apparel decoration"
                fill
                className="object-cover"
                priority
              />
              */}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-500/10"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-navy-800/5"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
