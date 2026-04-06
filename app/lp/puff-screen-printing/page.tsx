'use client';

import { Box, Palette, Shirt, ThermometerSun, Ruler, Check, Sparkles } from 'lucide-react';
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
    icon: Box,
    title: 'True 3D Effect',
    description: 'Our puff prints achieve optimal height of 0.4-0.5mm for that perfect raised texture that catches the eye and feels premium.',
  },
  {
    icon: Palette,
    title: 'Vibrant Colors',
    description: 'Puff ink maintains color vibrancy while adding dimension. Works especially well with bold, solid colors.',
  },
  {
    icon: Shirt,
    title: 'Soft Hand Feel',
    description: 'Despite the raised texture, our puff prints remain soft and comfortable against the skin.',
  },
  {
    icon: ThermometerSun,
    title: 'Heat-Activated Magic',
    description: 'The puff effect is created when the ink passes through our conveyor dryer, expanding to create the 3D texture.',
  },
  {
    icon: Ruler,
    title: '14" x 16" Max Print Size',
    description: 'Large enough for impactful chest prints and back designs while maintaining the integrity of the puff effect.',
  },
  {
    icon: Check,
    title: 'Durable & Washable',
    description: 'Properly cured puff prints maintain their raised texture through countless washes.',
  },
];

const pricingPreview = [
  { quantity: '50-99', price: 'From $5.50/ea' },
  { quantity: '100-249', price: 'From $4.50/ea' },
  { quantity: '250-499', price: 'From $3.75/ea' },
  { quantity: '500+', price: 'From $3.35/ea' },
];

const heroValueProps = [
  'Raised 3D texture with a soft, premium hand feel',
  'Prints ready in as little as 3 days',
  'Perfect for orders 50-10,000+ pieces',
  'Free shipping on orders over $500',
];

export default function PuffScreenPrintingLP() {
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
        service="puff-screen-printing"
        headline="Custom Puff Screen Printing"
        subheadline="Puff ink screen printing that creates a raised, three-dimensional finish your customers can feel. Ideal for streetwear, clothing brands, and custom merch. 50 piece minimum."
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
              Puff Screen Printing Pricing
            </h2>
            <p className="mt-2 text-slate-600">
              1 color puff, 1 location (up to 14&quot; x 16&quot;) &bull; Volume discounts available
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
              Get Your Puff Print Quote
            </button>
            <p className="text-sm text-slate-500 mt-3">
              * Pricing is for decoration only — garment cost varies by blank. $75 screen setup fee per color.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              How Puff Screen Printing Works
            </h2>
            <p className="mt-2 text-slate-600">
              Heat-activated ink that expands to create a raised, tactile 3D effect
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Puff Ink Preparation', desc: 'We mix high-quality plastisol with a precise ratio of puff additive and create a custom screen with the right mesh count for optimal ink deposit.' },
              { step: '02', title: 'Screen Printing', desc: 'Your design is printed using the puff ink blend, ensuring even coverage across the entire design for a consistent raised effect.' },
              { step: '03', title: 'Heat Activation', desc: 'The printed garment passes through our conveyor dryer where heat activates the foaming agent, causing the ink to expand and rise off the fabric.' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative bg-stone-50 rounded-2xl p-6 border border-stone-200"
              >
                <div className="text-4xl font-black text-brand-500/20 mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold text-navy-800 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
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
              Why Choose Puff Screen Printing?
            </h2>
            <p className="mt-2 text-slate-600">
              Add dimension and premium feel to your merchandise
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

      {/* What Works / What Doesn't */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
              What Makes a Great Puff Print?
            </h2>
            <p className="mt-2 text-slate-600">
              Not every design works well with puff printing — here&apos;s what to consider
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-green-50 rounded-2xl p-8 border border-green-100"
            >
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Check className="h-6 w-6" />
                Works Great with Puff
              </h3>
              <ul className="space-y-3 text-green-800">
                {[
                  'Bold text and typography',
                  'Simple logos with clean lines',
                  'Solid shapes and filled areas',
                  'Cotton or cotton-blend fabrics',
                  'Single or limited color designs',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-red-50 rounded-2xl p-8 border border-red-100"
            >
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <span className="text-red-500">&#10007;</span>
                Not Ideal for Puff
              </h3>
              <ul className="space-y-3 text-red-800">
                {[
                  'Fine details or thin lines',
                  'Small text (under 1/4" tall)',
                  'Gradients or halftones',
                  '100% polyester garments',
                  'Photo-realistic images',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">&#10007;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
            >
              Not Sure If Puff Works for You? Ask Us
            </button>
          </div>
        </div>
      </section>

      <LPPortfolio service="puff-screen-printing" />

      <LPTestimonials />

      <LPFactory service="puff-screen-printing" />

      <LPDedicatedRep service="puff-screen-printing" />

      <LPServiceAreas />

      {/* Final CTA */}
      <section className="py-12 lg:py-16 bg-navy-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready for Premium 3D Puff Prints?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Get a free puff screen printing quote within 2 hours. 50 piece minimum.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'lp_puff-screen-printing_final_cta' })}
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

      <LPStickyMobileCTA service="puff-screen-printing" />

      <LPFloatingCTA service="puff-screen-printing" />

      <LPExitIntent service="puff-screen-printing" />
    </div>
  );
}
