'use client';

import Link from 'next/link';
import { 
  Layers, 
  Scissors, 
  Monitor, 
  Sparkles, 
  Maximize2, 
  Palette, 
  Package, 
  Zap,
  ArrowRight,
  Check,
  HelpCircle,
  Shield,
  DollarSign,
  Clock,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BenefitsBadges, ServiceCTA, ProjectInquiryForm } from '@/components/services';

// All decoration services
const services = [
  {
    title: 'Screen Printing',
    description: 'Bold, vibrant prints that last. The gold standard for custom apparel with Pantone color matching.',
    icon: Layers,
    href: '/services/screen-printing',
    gradient: 'from-brand-500 to-brand-600',
    bestFor: 'Bulk orders, logos, bold graphics',
    minOrder: 50,
  },
  {
    title: 'Embroidery',
    description: 'Premium stitched logos and designs. Professional, durable, and perfect for corporate branding.',
    icon: Scissors,
    href: '/services/embroidery',
    gradient: 'from-indigo-500 to-purple-600',
    bestFor: 'Corporate wear, polos, caps',
    minOrder: 50,
  },
  {
    title: 'Digital Screen Printing',
    description: 'Full-color, photo-realistic prints using hybrid technology. Unlimited colors, no pretreatment needed.',
    icon: Monitor,
    href: '/services/digital-screen-printing',
    gradient: 'from-blue-500 to-cyan-500',
    bestFor: 'Photorealistic, gradients, full color',
    minOrder: 50,
  },
  {
    title: 'Puff Screen Printing',
    description: 'Raised 3D texture that pops off the garment. Creates a tactile, premium feel.',
    icon: Sparkles,
    href: '/services/puff-screen-printing',
    gradient: 'from-purple-500 to-pink-500',
    bestFor: 'Streetwear, logos, fashion brands',
    minOrder: 50,
  },
  {
    title: 'Jumbo Screen Printing',
    description: 'Oversized prints up to 17" x 23". Go bigger than industry standard for statement pieces.',
    icon: Maximize2,
    href: '/services/jumbo-screen-printing',
    gradient: 'from-emerald-500 to-teal-500',
    bestFor: 'Tour merch, streetwear, full coverage',
    minOrder: 50,
  },
  {
    title: 'Simulated Process',
    description: 'Halftone technique for photorealistic prints using spot colors. The classic "vintage tee" look.',
    icon: Palette,
    href: '/services/simulated-process',
    gradient: 'from-rose-500 to-orange-500',
    bestFor: 'Portraits, album art, vintage style',
    minOrder: 50,
  },
  {
    title: 'Retail Finishing',
    description: 'Transform decorated garments into retail-ready products with folding, bagging, tags, and labels.',
    icon: Package,
    href: '/services/retail-finishing',
    gradient: 'from-amber-500 to-orange-500',
    bestFor: 'E-commerce, retail distribution',
    minOrder: 100,
  },
  {
    title: 'Rush Services',
    description: 'Need it fast? Our rush production can deliver in as little as 48 hours when you are in a pinch.',
    icon: Zap,
    href: '/services/rush',
    gradient: 'from-red-500 to-rose-500',
    bestFor: 'Tight deadlines, last-minute orders',
    minOrder: 50,
  },
];

// Quick comparison of main methods
const comparison = {
  columns: ['Screen Print', 'Embroidery', 'Digital'],
  rows: [
    { feature: 'Best For', values: ['Bulk orders', 'Premium look', 'Full color'] },
    { feature: 'Durability', values: ['Excellent', 'Superior', 'Excellent'] },
    { feature: 'Max Colors', values: ['12+', 'Unlimited', 'Unlimited'] },
    { feature: 'Cost (bulk)', values: ['$', '$$', '$$'] },
    { feature: 'Min Order', values: ['50 pcs', '50 pcs', '50 pcs'] },
  ],
};

// Decision helper items
const decisionHelpers = [
  {
    question: 'Need bold graphics on 100+ shirts?',
    answer: 'Screen Printing',
    href: '/services/screen-printing',
    color: 'bg-brand-500',
  },
  {
    question: 'Need a premium look for corporate wear?',
    answer: 'Embroidery',
    href: '/services/embroidery',
    color: 'bg-indigo-500',
  },
  {
    question: 'Need full-color photo prints?',
    answer: 'Digital Screen Printing',
    href: '/services/digital-screen-printing',
    color: 'bg-blue-500',
  },
  {
    question: 'Need retail-ready merchandise?',
    answer: 'Retail Finishing',
    href: '/services/retail-finishing',
    color: 'bg-amber-500',
  },
];

// Why Garment Decor
const whyUs = [
  {
    icon: DollarSign,
    title: 'Factory Direct Pricing',
    description: 'No middleman markup. Price breaks at 75, 100, 250, 500, and 1,000+ pieces.',
  },
  {
    icon: Clock,
    title: 'Two-Week Turnaround',
    description: 'Standard turnaround is two weeks from artwork approval. Rush available.',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Every piece is inspected before shipping. We stand behind our work 100%.',
  },
  {
    icon: Award,
    title: 'Industry Experience',
    description: 'Over a decade of experience serving brands, businesses, and events.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-900 to-slate-900 py-20 lg:py-28">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-400 mb-4">
                Full-Service Decoration
              </p>
              <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Custom Decoration Services
              </h1>
              <p className="mt-6 text-xl text-slate-300 leading-relaxed">
                From screen printing to embroidery, we offer a complete range of decoration 
                services to bring your vision to life. Factory direct pricing, fast turnaround, 
                and quality you can count on.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/quote"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Request a Quote
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
                >
                  Shop Blank Apparel
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Badges */}
      <BenefitsBadges title="Why Work With Us" />

      {/* Services Grid */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              Our Decoration Services
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the right decoration method for your project. Each technique has unique strengths.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={service.href}
                    className="group block h-full rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/10"
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} text-white mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-navy-800 mb-2 group-hover:text-brand-600 transition-colors">
                      {service.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    
                    <p className="text-xs text-slate-500 mb-4">
                      <span className="font-medium">Best for:</span> {service.bestFor}
                    </p>
                    
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-2 transition-all">
                      Learn More
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Project Inquiry Form */}
      <ProjectInquiryForm />

      {/* Quick Comparison Table */}
      <section className="py-16 lg:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">
              Compare Main Methods
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A quick look at our most popular decoration techniques
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Feature
                    </th>
                    {comparison.columns.map((col, i) => (
                      <th 
                        key={i} 
                        className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-brand-600 bg-brand-50' : 'text-slate-500'}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {comparison.rows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {row.feature}
                      </td>
                      {row.values.map((val, j) => (
                        <td 
                          key={j} 
                          className={`px-4 py-3 text-center text-sm ${j === 0 ? 'bg-brand-50/50 font-medium text-slate-800' : 'text-slate-600'}`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-center text-sm text-slate-500">
              Not sure which is right? <Link href="/contact" className="text-brand-600 font-medium hover:underline">Contact us</Link> and we will help you decide.
            </p>
          </div>
        </div>
      </section>

      {/* Which Method Is Right - Decision Helper */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold text-navy-800">
              Which Method Is Right for You?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Answer a simple question to find your ideal decoration method
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            {decisionHelpers.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-5 transition-all hover:border-brand-200 hover:bg-white hover:shadow-md"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color} text-white`}>
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{item.question}</p>
                  <p className="font-semibold text-navy-800 group-hover:text-brand-600 transition-colors">
                    {item.answer} <ArrowRight className="inline h-4 w-4" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Garment Decor */}
      <section className="py-16 lg:py-20 bg-navy-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Why Choose Garment Decor?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              We are committed to quality, service, and value
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-brand-400 mx-auto mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Ready to Start Your Project?"
        subtitle="Request a quote and we'll respond within 24 hours. 50 piece minimum on most services."
        showRushBanner={true}
      />
    </div>
  );
}
