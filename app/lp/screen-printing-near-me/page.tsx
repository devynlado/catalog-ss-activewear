'use client';

import { Thermometer, Shield, DollarSign, Sparkles, Palette, Check } from 'lucide-react';
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
    icon: Thermometer,
    title: 'Properly Cured Prints',
    description: 'Every print cured at 320-330°F in our Southern California facility. No cracking, peeling, or fading — guaranteed.',
  },
  {
    icon: Shield,
    title: 'Premium Plastisol Inks',
    description: 'Vibrant colors that withstand hundreds of washes. The same quality trusted by LA brands and businesses statewide.',
  },
  {
    icon: DollarSign,
    title: 'Wholesale & Bulk Pricing',
    description: 'Factory-direct, no middleman. Price breaks at 75, 100, 250, 500, and 1,000+ pieces for bulk screen printing orders.',
  },
  {
    icon: Sparkles,
    title: 'Screen Printing & Embroidery',
    description: 'Full-service decoration company — screen printing, embroidery, heat transfer, and more under one roof.',
  },
  {
    icon: Palette,
    title: 'PMS Color Matching',
    description: 'Exact Pantone matching for perfect brand consistency on every order, from custom tees to industrial runs.',
  },
  {
    icon: Check,
    title: 'Quality Guaranteed',
    description: 'Every piece inspected at our Montclair facility before it ships. We stand behind our work 100%.',
  },
];

const pricingPreview = [
  { quantity: '50-99', price: 'From $4.95/pc' },
  { quantity: '100-249', price: 'From $3.45/pc' },
  { quantity: '250-499', price: 'From $2.95/pc' },
  { quantity: '500+', price: 'From $2.45/pc' },
];

export default function ScreenPrintingNearMeLP() {
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
        service="screen-printing"
        headline="Local Screen Printing in Los Angeles & Southern California"
        subheadline="Your nearby screen printing company — serving LA, Orange County, Hollywood, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum."
      />

      {/* Trust Signals */}
      <LPTrustSignals />

      {/* Delivery Dates */}
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
              Transparent Pricing
            </h2>
            <p className="mt-2 text-slate-600">
              1 color, 1 location • Wholesale volume discounts for bulk orders
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
              Get Your Exact Quote
            </button>
            <p className="text-sm text-slate-500 mt-3">
              * Pricing varies by colors, locations, and garment. We&apos;ll provide an exact quote.
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
              Why Local Businesses Choose Garment Decor
            </h2>
            <p className="mt-2 text-slate-600">
              California&apos;s trusted screen printing company
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

      {/* Portfolio */}
      <LPPortfolio service="screen-printing" dynamic categorySlug="screen-printing" />

      {/* Testimonials */}
      <LPTestimonials />

      {/* Our Factory */}
      <LPFactory service="screen-printing" />

      {/* Dedicated Expert */}
      <LPDedicatedRep service="screen-printing" />

      {/* Service Areas */}
      <LPServiceAreas />

      {/* Final CTA */}
      <section className="py-12 lg:py-16 bg-navy-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Looking for a Screen Printer Near You?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            We serve Los Angeles, Orange County, Santa Barbara, Hollywood, and all of Southern California. Get a free quote within 2 hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'lp_screen_printing_near_me_final_cta' })}
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
      <LPStickyMobileCTA service="screen-printing" />

      {/* Floating Desktop CTA */}
      <LPFloatingCTA service="screen-printing" />

      {/* Exit Intent Popup */}
      <LPExitIntent service="screen-printing" />
    </div>
  );
}
