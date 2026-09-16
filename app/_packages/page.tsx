'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Clock, Palette, Truck, ArrowRight, Star, Shirt } from 'lucide-react';

// Service types for badges
type ServiceType = 'embroidery' | 'screen-printing';
type CategoryType = 'headwear' | 'apparel';

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  priceAnchor: number;
  priceAnchorQty: string;
  priceStart: number;
  minQty: number;
  colorCount: number;
  turnaround: string;
  featured: boolean;
  badge: string | null;
  comingSoon?: boolean;
  includes: string[];
  serviceType: ServiceType;
  category: CategoryType;
  unitLabel: string;
}

// Package data - organized by service type and category
const packages: Package[] = [
  // Embroidered Headwear
  {
    id: 'embroidered-caps',
    name: 'Custom Embroidered Baseball Caps',
    slug: 'embroidered-caps',
    description: 'Premium 5-panel mid-profile baseball caps with your logo embroidered. Perfect for teams, events, and company swag.',
    image: '/images/embroidery/hero-custom-cap.png',
    priceAnchor: 13.95,
    priceAnchorQty: '100+',
    priceStart: 15.95,
    minQty: 50,
    colorCount: 47,
    turnaround: '10 days',
    featured: true,
    badge: 'Best Seller',
    includes: [
      'Front embroidery (up to 10K stitches)',
      'Free digitizing',
      'Pre-production sample approval',
      'Mix colors at no extra charge',
    ],
    serviceType: 'embroidery',
    category: 'headwear',
    unitLabel: 'hat',
  },
  {
    id: 'trucker-caps',
    name: 'Custom Embroidered Trucker Caps',
    slug: 'trucker-caps',
    description: 'Classic foam front trucker caps with mesh back. Retro style meets custom embroidery.',
    image: '/images/embroidery/hero-trucker-cap.png',
    priceAnchor: 11.95,
    priceAnchorQty: '100+',
    priceStart: 13.95,
    minQty: 50,
    colorCount: 30,
    turnaround: '10 days',
    featured: false,
    badge: null,
    comingSoon: false,
    includes: [
      'Front embroidery (up to 10K stitches)',
      'Free digitizing',
      'Pre-production sample approval',
      'Mix colors at no extra charge',
    ],
    serviceType: 'embroidery',
    category: 'headwear',
    unitLabel: 'hat',
  },
  {
    id: 'snapback-caps',
    name: 'Custom Embroidered Snapback Caps',
    slug: 'snapback-caps',
    description: 'Premium flat bill snapback caps with adjustable snap closure. Classic streetwear style.',
    image: '/images/embroidery/hero-snapback-cap.png',
    priceAnchor: 15.95,
    priceAnchorQty: '100+',
    priceStart: 17.95,
    minQty: 50,
    colorCount: 25,
    turnaround: '10 days',
    featured: false,
    badge: null,
    comingSoon: false,
    includes: [
      'Front embroidery (up to 10K stitches)',
      'Free digitizing',
      'Pre-production sample approval',
      'Mix colors at no extra charge',
    ],
    serviceType: 'embroidery',
    category: 'headwear',
    unitLabel: 'hat',
  },
  {
    id: 'dad-caps',
    name: 'Custom Embroidered Dad Caps',
    slug: 'dad-caps',
    description: 'Classic unstructured dad caps with a relaxed fit. The timeless casual look everyone loves.',
    image: '/images/embroidery/hero-dad-cap.webp',
    priceAnchor: 12.95,
    priceAnchorQty: '100+',
    priceStart: 14.95,
    minQty: 50,
    colorCount: 30,
    turnaround: '10 days',
    featured: false,
    badge: null,
    comingSoon: false,
    includes: [
      'Front embroidery (up to 10K stitches)',
      'Free digitizing',
      'Pre-production sample approval',
      'Mix colors at no extra charge',
    ],
    serviceType: 'embroidery',
    category: 'headwear',
    unitLabel: 'hat',
  },
  {
    id: 'beanies',
    name: 'Custom Embroidered Beanies',
    slug: 'beanies',
    description: 'Warm knit beanies with custom embroidery. Perfect for winter promotions and outdoor brands.',
    image: '/images/embroidery/hero-beanie.webp',
    priceAnchor: 11.95,
    priceAnchorQty: '100+',
    priceStart: 13.95,
    minQty: 50,
    colorCount: 24,
    turnaround: '10 days',
    featured: false,
    badge: null,
    comingSoon: false,
    includes: [
      'Cuff embroidery (up to 8K stitches)',
      'Free digitizing',
      'Pre-production sample approval',
      'Mix colors at no extra charge',
    ],
    serviceType: 'embroidery',
    category: 'headwear',
    unitLabel: 'beanie',
  },
  // Screen Printed Apparel
  {
    id: 'printed-tees-gildan',
    name: 'Custom Printed Gildan Tees',
    slug: 'printed-tees-gildan',
    description: 'The industry-standard Gildan 5000 Heavy Cotton tee with your design screen printed. Perfect for events, promotions, and uniforms.',
    image: '/images/packages/gildan-5000/gildan-5000-screen-printing-t-shirt.png',
    priceAnchor: 6.95,
    priceAnchorQty: '100+',
    priceStart: 8.95,
    minQty: 50,
    colorCount: 60,
    turnaround: '5-7 days',
    featured: false,
    badge: 'New',
    comingSoon: false,
    includes: [
      'Front print (up to 2 colors)',
      'Free art setup',
      'Free screens',
      'Mix sizes at no extra charge',
    ],
    serviceType: 'screen-printing',
    category: 'apparel',
    unitLabel: 'shirt',
  },
  {
    id: 'printed-tees-comfort-colors',
    name: 'Custom Printed Comfort Colors Tees',
    slug: 'printed-tees-comfort-colors',
    description: 'Premium garment-dyed heavyweight t-shirts with that vintage, lived-in feel. Perfect for bands, breweries, boutiques, and premium merch.',
    image: '/images/packages/comfort-colors-1717/comfort-colors-print.png',
    priceAnchor: 10.50,
    priceAnchorQty: '100+',
    priceStart: 13.25,
    minQty: 50,
    colorCount: 62,
    turnaround: '5-7 days',
    featured: false,
    badge: 'Premium',
    comingSoon: false,
    includes: [
      'Front print (up to 2 colors)',
      'Free art setup',
      'Free screens',
      'Mix sizes at no extra charge',
    ],
    serviceType: 'screen-printing',
    category: 'apparel',
    unitLabel: 'shirt',
  },
  {
    id: 'printed-totes-isabella',
    name: 'Custom Printed Canvas Tote Bags',
    slug: 'printed-totes-isabella',
    description: 'Premium 12 oz. cotton canvas tote bags with your design screen printed. Perfect for events, retail, and promotional giveaways.',
    image: '/images/packages/tote-bags/hero-tote-bag.png',
    priceAnchor: 5.95,
    priceAnchorQty: '500+',
    priceStart: 8.75,
    minQty: 50,
    colorCount: 12,
    turnaround: '5-7 days',
    featured: false,
    badge: 'New',
    comingSoon: false,
    includes: [
      'One-side print (up to 2 colors)',
      'Free art setup',
      'Free screens',
      'Mix bag colors at no extra charge',
    ],
    serviceType: 'screen-printing',
    category: 'apparel',
    unitLabel: 'bag',
  },
];

// Service badge component
function ServiceBadge({ serviceType }: { serviceType: ServiceType }) {
  if (serviceType === 'embroidery') {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Embroidered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      Screen Printed
    </span>
  );
}

const trustBadges = [
  { icon: Sparkles, text: 'All-Inclusive Pricing' },
  { icon: Check, text: 'No Hidden Fees' },
  { icon: Clock, text: 'Fast Turnaround' },
  { icon: Truck, text: 'Free Shipping $500+' },
];

export default function PackagesPage() {
  const featuredPackage = packages.find(p => p.featured);
  
  // Group packages by category (excluding featured)
  const headwearPackages = packages.filter(p => p.category === 'headwear' && !p.featured);
  const apparelPackages = packages.filter(p => p.category === 'apparel' && !p.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF6F3] to-stone-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 lg:py-20">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              All-Inclusive Custom Merch
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Package Deals
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto">
              Transparent, all-inclusive pricing on custom embroidered and screen printed gear. 
              No hidden fees, no surprises. Just quality at honest prices.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <badge.icon className="h-4 w-4 text-brand-400" />
                <span className="text-sm text-white font-medium">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Package */}
      {featuredPackage && (
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-semibold text-navy-900">Featured Package</h2>
              </div>

              <Link href={`/packages/${featuredPackage.slug}`}>
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-stone-200/50 border border-white/60 overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative bg-gradient-to-br from-stone-100 to-stone-50 p-3 overflow-hidden">
                      <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <span className="bg-brand-500/95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                          {featuredPackage.badge}
                        </span>
                        <ServiceBadge serviceType={featuredPackage.serviceType} />
                      </div>
                      <div className="relative aspect-square">
                        <Image
                          src={featuredPackage.image}
                          alt={featuredPackage.name}
                          fill
                          className="object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-navy-900 shadow-sm">
                        {featuredPackage.colorCount} Colors
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <h3 className="text-2xl lg:text-3xl font-bold text-navy-900 mb-3">
                        {featuredPackage.name}
                      </h3>
                      <p className="text-stone-600 mb-6">
                        {featuredPackage.description}
                      </p>

                      {/* Pricing */}
                      <div className="bg-gradient-to-r from-stone-50 to-stone-100/50 rounded-2xl p-5 mb-6 border border-stone-200/50">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-stone-500 text-sm">From</span>
                          <span className="text-3xl font-bold text-navy-900">${featuredPackage.priceAnchor.toFixed(2)}</span>
                          <span className="text-stone-600">/{featuredPackage.unitLabel}</span>
                        </div>
                        <p className="text-sm text-stone-500">
                          at {featuredPackage.priceAnchorQty} qty · {featuredPackage.minQty} qty: ${featuredPackage.priceStart.toFixed(2)}
                        </p>
                      </div>

                      {/* Includes */}
                      <div className="space-y-2 mb-6">
                        {featuredPackage.includes.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm text-stone-600">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl group-hover:from-brand-600 group-hover:to-brand-700 transition-all shadow-lg shadow-brand-500/30">
                          Build Your Package
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <span className="text-sm text-stone-500">
                          Min {featuredPackage.minQty} · {featuredPackage.turnaround} turnaround
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Caps & Headwear Section */}
      {headwearPackages.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-100">
                <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">Caps & Headwear</h2>
                <p className="text-sm text-stone-500">Custom embroidered hats for every style</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {headwearPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <PackageCard pkg={pkg} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* T-Shirts & Apparel Section */}
      {apparelPackages.length > 0 && (
        <section className="py-12 lg:py-16 bg-gradient-to-b from-stone-100/50 to-stone-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100">
                <Shirt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">T-Shirts & Apparel</h2>
                <p className="text-sm text-stone-500">Custom screen printed apparel for any occasion</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apparelPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <PackageCard pkg={pkg} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-b from-stone-100 to-[#FAF6F3]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Need Something Custom?
          </h2>
          <p className="text-stone-600 mb-6">
            Don&apos;t see what you&apos;re looking for? We offer custom embroidery and screen printing on a wide range of products. 
            Get a free quote with a mockup of your design.
          </p>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center px-8 py-3 bg-navy-900 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/25"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
}

// Package Card Component
function PackageCard({ pkg }: { pkg: Package }) {
  if (pkg.comingSoon) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden opacity-75 h-full">
        {/* Image */}
        <div className="relative bg-gradient-to-br from-stone-100 to-stone-50 p-6 aspect-[4/3]">
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-stone-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {pkg.badge}
            </span>
          </div>
          <div className="relative h-full w-full flex items-center justify-center">
            <div className="text-center">
              <Palette className="h-16 w-16 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400 font-medium">Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-navy-900 mb-2">
            {pkg.name}
          </h3>
          <p className="text-sm text-stone-500 mb-4 line-clamp-2">
            {pkg.description}
          </p>

          {/* Pricing preview */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-stone-400 text-xs">From</span>
            <span className="text-xl font-bold text-stone-400">${pkg.priceAnchor.toFixed(2)}</span>
            <span className="text-stone-400 text-sm">/{pkg.unitLabel}</span>
          </div>

          <button
            disabled
            className="w-full py-2.5 bg-stone-200 text-stone-500 font-medium rounded-xl cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/packages/${pkg.slug}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all group h-full flex flex-col">
        {/* Image */}
        <div className="relative bg-gradient-to-br from-stone-100 to-stone-50 p-3 aspect-square overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {pkg.badge && (
              <span className="bg-brand-500/95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
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
          <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-navy-900 shadow-sm">
            {pkg.colorCount} Colors
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-brand-600 transition-colors">
            {pkg.name}
          </h3>
          <p className="text-sm text-stone-500 mb-4 line-clamp-2 flex-1">
            {pkg.description}
          </p>

          {/* Pricing */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-stone-500 text-xs">From</span>
              <span className="text-xl font-bold text-navy-900">${pkg.priceAnchor.toFixed(2)}</span>
              <span className="text-stone-600 text-sm">/{pkg.unitLabel}</span>
            </div>
            <p className="text-xs text-stone-400">
              at {pkg.priceAnchorQty} qty · {pkg.minQty} qty: ${pkg.priceStart.toFixed(2)}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500">
              Min {pkg.minQty} · {pkg.turnaround}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-lg group-hover:from-brand-600 group-hover:to-brand-700 transition-all shadow-sm">
              View
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
