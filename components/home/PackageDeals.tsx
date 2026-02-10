'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

// Featured packages for the home page - subset of main packages
const featuredPackages = [
  {
    id: 'embroidered-caps',
    name: 'Custom Embroidered Caps',
    slug: 'embroidered-caps',
    image: '/images/embroidery/hero-custom-cap.png',
    priceFrom: 13.95,
    priceQty: '100+',
    badge: 'Best Seller',
    serviceType: 'embroidery' as const,
  },
  {
    id: 'printed-tees-gildan',
    name: 'Custom Printed Gildan Tees',
    slug: 'printed-tees-gildan',
    image: '/images/packages/gildan-5000/gildan-5000-screen-printing-t-shirt.png',
    priceFrom: 6.95,
    priceQty: '100+',
    badge: 'Popular',
    serviceType: 'screen-printing' as const,
  },
  {
    id: 'printed-tees-comfort-colors',
    name: 'Comfort Colors Tees',
    slug: 'printed-tees-comfort-colors',
    image: '/images/packages/comfort-colors-1717/comfort-colors-print.png',
    priceFrom: 10.50,
    priceQty: '100+',
    badge: 'Premium',
    serviceType: 'screen-printing' as const,
  },
];

function ServiceBadge({ serviceType }: { serviceType: 'embroidery' | 'screen-printing' }) {
  if (serviceType === 'embroidery') {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
        Embroidered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
      Screen Printed
    </span>
  );
}

export function PackageDeals() {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-b from-white to-stone-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Instant Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-800 mb-3">
              Want instant pricing? Try our packages.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              All-inclusive deals with transparent pricing. No quotes needed — just pick your product, 
              quantity, and checkout.
            </p>
          </motion.div>
        </div>

        {/* Package Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {featuredPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/packages/${pkg.slug}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all group h-full flex flex-col">
                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-stone-100 to-stone-50 p-3 aspect-square">
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                      {pkg.badge && (
                        <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                          {pkg.badge}
                        </span>
                      )}
                      <ServiceBadge serviceType={pkg.serviceType} />
                    </div>
                    <div className="relative h-full w-full">
                      <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        className="object-contain group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-brand-600 transition-colors">
                      {pkg.name}
                    </h3>

                    {/* Pricing */}
                    <div className="mb-4 flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-stone-500 text-xs">From</span>
                        <span className="text-xl font-bold text-navy-900">${pkg.priceFrom.toFixed(2)}</span>
                        <span className="text-stone-600 text-sm">/each</span>
                      </div>
                      <p className="text-xs text-stone-400">
                        at {pkg.priceQty} qty • All-inclusive
                      </p>
                    </div>

                    {/* CTA Button */}
                    <span className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl group-hover:from-brand-600 group-hover:to-brand-700 transition-all shadow-sm">
                      Build Package
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Benefits Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mb-8"
        >
          {[
            'Transparent all-in pricing',
            'No hidden fees',
            'Free digitizing & art setup',
            '50 piece minimum',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            View all packages
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
