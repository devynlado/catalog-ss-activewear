'use client';

import { Zap, Palette, Droplets, DollarSign, Shield, Check } from 'lucide-react';
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
    icon: Zap,
    title: '400 Garments Per Hour',
    description: 'Our hybrid process is 8x faster than traditional DTG, making it ideal for bulk full-color orders.',
  },
  {
    icon: Palette,
    title: 'Unlimited Colors',
    description: 'Full CMYK color range means unlimited colors at no extra cost — gradients, photos, and complex artwork.',
  },
  {
    icon: Droplets,
    title: 'Soft Water-Based Feel',
    description: 'Unlike plasticky DTF transfers, our water-based inks feel soft and breathable on the fabric.',
  },
  {
    icon: DollarSign,
    title: '2x Better Pricing vs DTG',
    description: 'At bulk quantities, digital screen printing costs roughly half what DTG charges per piece.',
  },
  {
    icon: Shield,
    title: 'No Pretreatment Required',
    description: 'Unlike DTG, our hybrid process skips chemical pretreatment — cleaner workflow, faster turnaround.',
  },
  {
    icon: Check,
    title: 'Quality Guaranteed',
    description: 'Every print inspected for color accuracy, adhesion, and cure. We stand behind our work 100%.',
  },
];

const pricingPreview = [
  { quantity: '50-74', price: 'From $8.00/ea' },
  { quantity: '75-99', price: 'From $6.50/ea' },
  { quantity: '100-249', price: 'From $5.50/ea' },
  { quantity: '250+', price: 'From $4.50/ea' },
];

const heroValueProps = [
  'Full-color screen printing — no extra charge per color',
  'Photo-realistic prints in as little as 3 days',
  'Perfect for orders 50-10,000+ pieces',
  'Free shipping on orders over $500',
];

const comparisonRows = [
  { feature: 'Print Speed', ours: '400 garments/hour', theirs: '~50 garments/hour' },
  { feature: 'Feel', ours: 'Water-based, soft finish', theirs: 'Sticker-like, plasticky' },
  { feature: 'Pretreatment', ours: 'Not required', theirs: 'Required (DTG)' },
  { feature: 'Best For', ours: 'Full color bulk (50+)', theirs: 'Low qty / samples' },
  { feature: 'Cost at 100+ pcs', ours: 'Very competitive', theirs: '~2x more expensive' },
  { feature: 'Durability', ours: 'Screen print durability', theirs: 'Good, varies' },
];

export default function DigitalScreenPrintingLP() {
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
        service="digital-screen-printing"
        headline="Custom Digital Screen Printing"
        subheadline="Unlimited colors, photo-realistic detail, and the soft feel of water-based inks — all at bulk screen printing prices. 50 piece minimum."
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
              Digital Screen Printing Pricing
            </h2>
            <p className="mt-2 text-slate-600">
              Full color, 1 location (up to 15&quot; x 18&quot;) &bull; Volume discounts available
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
              Get Your Digital Print Quote
            </button>
            <p className="text-sm text-slate-500 mt-3">
              * Pricing is for decoration only — garment cost varies by blank. $100 flat setup fee.
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
              How Digital Screen Printing Works
            </h2>
            <p className="mt-2 text-slate-600">
              A hybrid process that combines screen printing with digital printing
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Screen Print White Base', desc: 'A water-based white underbase is screen printed onto the garment to anchor the color layer.' },
              { step: '02', title: 'Digital Color Layer', desc: 'Your full-color CMYK artwork is printed digitally on top of the base — unlimited colors, no extra cost.' },
              { step: '03', title: 'Cure & Inspect', desc: 'Every print passes through a gas dryer for 2+ minutes, then gets inspected for color accuracy.' },
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
              Why Choose Digital Screen Printing?
            </h2>
            <p className="mt-2 text-slate-600">
              The best of both worlds — screen printing speed with full-color digital capability
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

      {/* Comparison Table */}
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
              Digital Screen Printing vs DTG/DTF
            </h2>
            <p className="mt-2 text-slate-600">
              See how our hybrid process compares to traditional digital methods
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-stone-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy-800 text-white">
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/3">Feature</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/3 bg-brand-500">Digital Screen Print</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-1/3">DTG / DTF</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr key={row.feature} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-navy-800">{row.feature}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium bg-brand-50/50">{row.ours}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{row.theirs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
            >
              Get a Free Quote
            </button>
          </div>
        </div>
      </section>

      <LPPortfolio service="digital-screen-printing" />

      <LPTestimonials />

      <LPFactory service="digital-screen-printing" />

      <LPDedicatedRep service="digital-screen-printing" />

      <LPServiceAreas />

      {/* Final CTA */}
      <section className="py-12 lg:py-16 bg-navy-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready for Full-Color Digital Prints?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Get a free digital screen printing quote within 2 hours. 50 piece minimum.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+18559427636"
              onClick={() => trackPhoneClick({ source: 'lp_digital-screen-printing_final_cta' })}
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

      <LPStickyMobileCTA service="digital-screen-printing" />

      <LPFloatingCTA service="digital-screen-printing" />

      <LPExitIntent service="digital-screen-printing" />
    </div>
  );
}
