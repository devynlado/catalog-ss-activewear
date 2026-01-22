'use client';

import { Award, Clock, Star, Shield, Truck, HeartHandshake } from 'lucide-react';

const signals = [
  {
    icon: Award,
    title: '15+ Years',
    subtitle: 'Industry Experience',
    description: 'Trusted by businesses since 2010',
  },
  {
    icon: Clock,
    title: 'Guaranteed',
    subtitle: 'Turnaround Time',
    description: 'Rush orders in 48 hours',
  },
  {
    icon: Star,
    title: '4.8★ Rating',
    subtitle: 'On Google',
    description: 'Hundreds of 5-star reviews',
  },
];

const additionalFeatures = [
  { icon: Shield, text: 'Quality Guarantee' },
  { icon: Truck, text: 'Free Shipping on $500+' },
  { icon: HeartHandshake, text: 'Dedicated Support' },
];

export function TrustSignals() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
            Why Choose Garment Decor?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            We're committed to delivering quality products and exceptional service, every time.
          </p>
        </div>

        {/* Main Trust Signals */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {signals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <div
                key={index}
                className="relative rounded-2xl border border-slate-200 bg-white p-8 text-center transition-all hover:border-brand-300 hover:shadow-lg"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                  <Icon className="h-8 w-8 text-brand-500" />
                </div>
                <h3 className="mt-6 text-3xl font-bold text-navy-800">
                  {signal.title}
                </h3>
                <p className="mt-1 text-lg font-medium text-brand-500">
                  {signal.subtitle}
                </p>
                <p className="mt-3 text-slate-600">
                  {signal.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional Features */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-slate-200 pt-12">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-slate-600">
                <Icon className="h-5 w-5 text-brand-500" />
                <span className="font-medium">{feature.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
