'use client';

import { Maximize2, Shield, DollarSign, Shirt, Layers, Check } from 'lucide-react';
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

const whyChooseReasons = [
  {
    icon: Maximize2,
    title: 'Oversized Print Capability',
    description: 'Jumbo platens and screens built for oversized prints up to 18" x 23" — larger than most shops can handle.',
  },
  {
    icon: Shield,
    title: 'Premium Plastisol Inks',
    description: 'Vibrant colors that withstand hundreds of washes without cracking or fading.',
  },
  {
    icon: DollarSign,
    title: 'Factory Direct Pricing',
    description: 'No middleman. Price breaks at 75, 100, 250, and 500+ pieces on jumbo screen printing.',
  },
  {
    icon: Layers,
    title: 'Streetwear-Ready Quality',
    description: 'The same oversized print techniques used by established streetwear brands and tour merch.',
  },
  {
    icon: Shirt,
    title: 'Multiple Garment Brands',
    description: 'LA Apparel, Shaka Wear, Independent Trading, Comfort Colors — we print on the blanks your brand needs.',
  },
  {
    icon: Check,
    title: 'Quality Guaranteed',
    description: 'Every oversized print inspected for coverage, registration, and cure. We stand behind our work 100%.',
  },
];

const pricingPreview = [
  { quantity: '50-74', price: 'From $4.95/ea' },
  { quantity: '75-99', price: 'From $4.20/ea' },
  { quantity: '100-249', price: 'From $3.75/ea' },
  { quantity: '250+', price: 'From $2.45/ea' },
];

const heroValueProps = [
  'Jumbo prints up to 18" x 23" — larger than standard shops',
  'Custom oversized printing in as little as 3 days',
  'Perfect for orders 50-10,000+ pieces',
  'Free shipping on orders over $500',
];

export default function JumboScreenPrintingLP() {
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
      <LPHero
        service="jumbo-screen-printing"
        headline="Custom Jumbo & Oversized Screen Printing"
        subheadline="Large-format prints up to 18&quot; x 23&quot; on tees, hoodies, and long sleeves. Factory-direct pricing, same week turnaround available, 50 piece minimum."
        valuePropOverrides={heroValueProps}
      />

      <LPTrustSignals />

      <LPDeliveryDates />

      {/* Pricing Preview */}
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
              Jumbo Screen Printing Pricing
            </h2>
            <p className="mt-2 text-slate-600">
              1 color, 1 location, oversized print area (up to 18&quot; x 23&quot;) • Volume discounts available
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
                    ? 'bg-brand-500 text-white' 
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Your Jumbo Print Quote
            </button>
            <p className="text-sm text-slate-500 mt-3">
              * Pricing is for decoration only — garment cost varies by blank. Setup fees apply.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative py-12 lg:py-16 bg-gradient-to-b from-white to-stone-50/50 overflow-hidden">
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              Why Choose Garment Decor for Oversized Printing?
            </h2>
            <p className="mt-2 text-slate-600">
              Trusted by streetwear brands, merch companies, and events across Southern California
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
                  className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4">
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

      <LPPortfolio service="jumbo-screen-printing" dynamic categorySlug="jumbo-screen-printing" />

      <LPTestimonials />

      <LPFactory service="jumbo-screen-printing" />

      <LPDedicatedRep service="jumbo-screen-printing" />

      <LPServiceAreas />

      {/* Final CTA */}
      <section className="py-12 lg:py-16 bg-navy-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready for Custom Oversized Prints?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Get a free jumbo screen printing quote within 2 hours. 50 piece minimum.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'lp_jumbo-screen-printing_final_cta' })}
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

      <LPStickyMobileCTA service="jumbo-screen-printing" />

      <LPFloatingCTA service="jumbo-screen-printing" />

      <LPExitIntent service="jumbo-screen-printing" />
    </div>
  );
}
