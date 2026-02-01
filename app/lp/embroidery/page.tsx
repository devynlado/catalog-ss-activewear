'use client';

import Link from 'next/link';
import { Scissors, Shield, DollarSign, Layers, Palette, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LPHero, 
  LPTrustSignals, 
  LPServiceAreas,
  LPStickyMobileCTA,
  LPExitIntent,
  LPTestimonials,
  LPPortfolio,
  LPFactory,
  LPDedicatedRep,
  LPDeliveryDates,
  LPFloatingCTA,
} from '../_components';
import { trackPhoneClick } from '@/lib/analytics';

// Why Choose reasons for Embroidery
const whyChooseReasons = [
  {
    icon: Scissors,
    title: 'Premium Thread Quality',
    description: 'Madeira and Isacord threads that resist fading through hundreds of washes.',
  },
  {
    icon: Shield,
    title: 'Professional Digitizing',
    description: 'Expert digitizers optimize your artwork for clean, crisp embroidery.',
  },
  {
    icon: DollarSign,
    title: 'Factory Direct Pricing',
    description: 'No middleman. Volume discounts at 50, 100, 250, 500+ pieces.',
  },
  {
    icon: Layers,
    title: 'Multi-Head Machines',
    description: 'Industrial equipment for consistent quality and fast turnaround.',
  },
  {
    icon: Palette,
    title: 'Unlimited Thread Colors',
    description: 'Match your brand exactly with our extensive thread library.',
  },
  {
    icon: Check,
    title: 'Quality Guaranteed',
    description: 'Every piece inspected. We stand behind our work 100%.',
  },
];

// Pricing tiers preview
const pricingPreview = [
  { quantity: '24-49', price: 'From $8.95/pc' },
  { quantity: '50-99', price: 'From $6.95/pc' },
  { quantity: '100-249', price: 'From $5.45/pc' },
  { quantity: '250+', price: 'From $4.45/pc' },
];

// Popular items with links to catalog categories
const popularItems = [
  { name: 'Polo Shirts', href: '/catalog/polos' },
  { name: 'Caps & Hats', href: '/catalog/headwear' },
  { name: 'Jackets', href: '/catalog/jackets' },
  { name: 'Workwear', href: '/catalog/workwear' },
  { name: 'Bags', href: '/catalog/bags' },
  { name: 'Sweatshirts', href: '/catalog/sweatshirts' },
];

export default function EmbroideryLP() {
  const scrollToForm = () => {
    const form = document.querySelector('form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const firstInput = form.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Hero with Form */}
      <LPHero
        service="embroidery"
        headline="Custom Embroidery in Southern California"
        subheadline="Professional embroidery with premium threads, expert digitizing, and factory-direct pricing. Perfect for logos, uniforms, and corporate apparel."
      />

      {/* Trust Signals */}
      <LPTrustSignals />

      {/* Delivery Dates */}
      <LPDeliveryDates />

      {/* Pricing Preview - Early placement for qualification */}
      <section className="py-12 lg:py-16 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Transparent Pricing
            </h2>
            <p className="mt-2 text-slate-600">
              1 location, up to 8K stitches • Volume discounts available
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPreview.map((tier, index) => (
              <motion.div
                key={tier.quantity}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-xl p-6 text-center ${
                  index === 3 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white border border-stone-200'
                }`}
              >
                <div className={`text-sm font-medium ${
                  index === 3 ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {tier.quantity} pieces
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  index === 3 ? 'text-white' : 'text-navy-800'
                }`}>
                  {tier.price}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Your Exact Quote
            </button>
            <p className="text-sm text-slate-500 mt-3">
              * Pricing based on 8,000 stitch design. Larger designs priced per 1,000 stitches.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Items - Clickable */}
      <section className="py-10 bg-indigo-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h2 className="text-xl font-bold text-navy-800">
              Popular for Embroidery
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Browse our blank apparel catalog
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {popularItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative py-12 lg:py-16 bg-gradient-to-b from-white to-stone-50/50 overflow-hidden">
        {/* Grain texture */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Why Choose Garment Decor?
            </h2>
            <p className="mt-2 text-slate-600">
              Trusted by businesses across Southern California
            </p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {whyChooseReasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-800 mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {reason.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <LPPortfolio service="embroidery" />

      {/* Testimonials */}
      <LPTestimonials />

      {/* Our Factory */}
      <LPFactory service="embroidery" />

      {/* Dedicated Expert */}
      <LPDedicatedRep service="embroidery" />

      {/* Service Areas */}
      <LPServiceAreas />

      {/* Final CTA */}
      <section className="py-12 lg:py-16 bg-navy-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Start Your Order?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Get a free quote within 2 hours. Free digitizing included.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'lp_embroidery_final_cta' })}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-navy-800 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
            >
              Call (855) 942-7636
            </a>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white hover:text-navy-800"
            >
              Get Quote Online
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <LPStickyMobileCTA service="embroidery" />

      {/* Floating Desktop CTA */}
      <LPFloatingCTA service="embroidery" />

      {/* Exit Intent Popup */}
      <LPExitIntent service="embroidery" />
    </div>
  );
}
