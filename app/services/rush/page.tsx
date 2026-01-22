'use client';

import Link from 'next/link';
import { Zap, Clock, CalendarCheck, Phone, FileCheck, Truck, ArrowRight, Check, AlertCircle } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  TipsSection,
  PortfolioGrid,
  ServiceCTA,
} from '@/components/services';

// Metadata handled in layout

const turnaroundTiers = [
  {
    name: 'Standard',
    timeframe: '10 Business Days',
    description: 'Our standard production time from final artwork approval and receipt of all blank garments.',
    icon: Clock,
    color: 'bg-slate-100 border-slate-200 text-slate-700',
    iconColor: 'text-slate-500',
    features: ['No rush fees', 'Full production capacity', 'All services available'],
  },
  {
    name: 'Quick Turn',
    timeframe: '5-7 Business Days',
    description: 'Expedited production for time-sensitive projects. Subject to current production schedule.',
    icon: CalendarCheck,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconColor: 'text-blue-500',
    features: ['Priority scheduling', 'Expedited approval process', 'Most services available'],
  },
  {
    name: 'Rush',
    timeframe: '2-4 Business Days',
    description: 'Fastest turnaround for urgent deadlines. Call immediately to confirm availability.',
    icon: Zap,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-500',
    features: ['Rush fees apply', 'Call to confirm slot', 'First-come, first-served'],
    highlighted: true,
  },
];

const rushRequirements = [
  {
    icon: FileCheck,
    title: 'Artwork Ready',
    description: 'Final, print-ready files must be submitted upfront. No revisions during rush production.',
  },
  {
    icon: Check,
    title: 'Quick Approval',
    description: 'Proofs must be approved immediately. Delays in approval delay production.',
  },
  {
    icon: Truck,
    title: 'Garments Available',
    description: 'Blank garments must be in stock and delivered before production can begin.',
  },
  {
    icon: Phone,
    title: 'Direct Communication',
    description: 'Rush orders require immediate contact with your rep to confirm slot availability.',
  },
];

const servicesAvailable = [
  { name: 'Screen Printing', href: '/services/screen-printing', rushAvailable: true },
  { name: 'Embroidery', href: '/services/embroidery', rushAvailable: true },
  { name: 'Digital Screen Printing', href: '/services/digital-screen-printing', rushAvailable: true },
  { name: 'Simulated Process', href: '/services/simulated-process', rushAvailable: true },
  { name: 'Puff Screen Printing', href: '/services/puff-screen-printing', rushAvailable: true },
  { name: 'Jumbo Screen Printing', href: '/services/jumbo-screen-printing', rushAvailable: true },
  { name: 'Retail Finishing', href: '/services/retail-finishing', rushAvailable: true },
];

const tips = [
  {
    title: 'Contact Us Immediately',
    description: 'Call (855) 942-7636 as soon as you know you need a rush. Slots are limited and first-come, first-served.',
  },
  {
    title: 'Have Your Artwork Ready',
    description: 'Submit high-resolution art at 300 DPI (AI, EPS, PDF, or PNG). Rush orders have no time for revisions.',
  },
  {
    title: 'Know Your Project Details',
    description: 'Have your sizes, colors, quantities, and decoration specs ready. The faster we have info, the faster we move.',
  },
  {
    title: 'Approve Proofs Quickly',
    description: 'Review mockups and samples immediately when sent. Every hour of delay affects your timeline.',
  },
  {
    title: 'Coordinate Shipping',
    description: 'Plan your delivery method in advance. Overnight shipping may be required to meet tight deadlines.',
  },
];

const portfolioItems = [
  { title: '48-Hour Event T-Shirts - 500 pieces', tags: ['Rush', 'Screen Printing'] },
  { title: 'Last-Minute Tour Merch Drop', tags: ['Rush', 'Music'] },
  { title: 'Emergency Corporate Event Polos', tags: ['Rush', 'Embroidery'] },
  { title: 'Festival Vendor Shirts - 3 Day Turn', tags: ['Rush', 'Events'] },
  { title: 'Sports Championship Gear', tags: ['Rush', 'Sports'] },
  { title: 'Product Launch Promo Items', tags: ['Rush', 'Corporate'] },
  { title: 'Wedding Party Emergency Order', tags: ['Rush', 'Special Events'] },
  { title: 'Trade Show Booth Uniforms', tags: ['Rush', 'Corporate'] },
];

export default function RushPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <ServiceHero
        title="Rush Turnaround"
        tagline="When You Need It Fast"
        description="Tight deadline? We specialize in rush screen printing and embroidery services for clothing brands and businesses. From 48-hour emergency orders to quick-turn weekly drops, we've built our shop around speed without sacrificing quality. Your delivery is guaranteed."
        icon={Zap}
        gradient="from-amber-500 to-orange-600"
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* Turnaround Tiers */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Turnaround Options</h2>
            <p className="mt-4 text-lg text-slate-600">
              How fast do you need it? We have options for every timeline.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {turnaroundTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <div
                  key={index}
                  className={`relative rounded-2xl border-2 p-8 ${tier.color} ${
                    tier.highlighted ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Fastest Option
                    </div>
                  )}
                  
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-white mb-4`}>
                    <Icon className={`h-7 w-7 ${tier.iconColor}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-3xl font-bold mb-4">{tier.timeframe}</p>
                  <p className="text-sm opacity-80 mb-6">{tier.description}</p>
                  
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 text-center">
            <a
              href="tel:+18559427636"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600"
            >
              <Phone className="h-5 w-5" />
              Call Now for Rush Availability
            </a>
          </div>
        </div>
      </section>

      {/* Rush Requirements */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Rush Order Requirements</h2>
            <p className="mt-4 text-lg text-slate-600">
              To guarantee rush turnaround, we need these from you
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rushRequirements.map((req, index) => {
              const Icon = req.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-navy-800 mb-2">{req.title}</h3>
                  <p className="text-sm text-slate-600">{req.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-4 md:items-center">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800">Rush Fees Apply</h3>
              <p className="text-amber-700">
                Rush orders are quoted based on order complexity, decoration method, and required delivery date. 
                Rush jobs are scheduled first-come, first-served. Contact your sales rep as early as possible to confirm availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Available for Rush */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">All Services Available for Rush</h2>
            <p className="mt-4 text-lg text-slate-600">
              We can rush any of our decoration methods
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {servicesAvailable.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="group inline-flex items-center gap-3 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-brand-500 hover:text-white"
              >
                <Zap className="h-4 w-4 text-amber-500 group-hover:text-white" />
                {service.name}
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <PortfolioGrid
        title="Rush Order Success Stories"
        subtitle="Tight deadlines, delivered on time"
        items={portfolioItems}
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for a Successful Rush Order"
        tips={tips}
      />

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">How to Place a Rush Order</h2>
            <p className="mt-4 text-lg text-slate-600">Get your order started in minutes</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: 1,
                title: 'Call Us Immediately',
                description: 'Don\'t email—call (855) 942-7636 directly to confirm rush availability and lock in your slot.',
              },
              {
                step: 2,
                title: 'Submit Everything Upfront',
                description: 'Artwork, sizes, colors, quantities, and delivery details. We need it all to move fast.',
              },
              {
                step: 3,
                title: 'Approve & We Go',
                description: 'Once you approve the proof and pay, production starts immediately. We handle the rest.',
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Need It Fast? Let's Make It Happen.
              </h2>
              <p className="mt-2 text-slate-300">
                Call now to check rush availability. We're ready when you are.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-400"
              >
                <Phone className="h-5 w-5" />
                Call (855) 942-7636
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
              >
                Request a Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
