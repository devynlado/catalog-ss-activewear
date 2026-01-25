'use client';

import { Package, Tag, Scissors, Award, Barcode, ShoppingBag, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  ServiceHero,
  BenefitsBadges,
  ServiceCTA,
  ShopBlanksSection,
} from '@/components/services';

// Metadata handled in layout

const finishingServices = [
  {
    icon: Package,
    title: 'Fold & Poly Bag',
    description: 'Professional folding and individual poly bagging for retail presentation. Perfect for e-commerce fulfillment, retail distribution, or organized inventory.',
    features: [
      'Consistent, professional folding',
      'Clear poly bags',
      'Size stickers available',
      'Tissue paper wrapping optional',
    ],
    pricing: 'Contact for pricing',
  },
  {
    icon: Tag,
    title: 'Screen Printed Neck Tags',
    description: 'Replace the manufacturer tag with your own branded neck label. Screen printed directly inside the collar for a clean, tagless finish.',
    features: [
      'Remove existing tag or print over',
      'Your logo, size, care instructions',
      'Soft, comfortable finish',
      'Works with tear-away tags',
    ],
    pricing: 'Contact for pricing',
  },
  {
    icon: Scissors,
    title: 'Woven Labels',
    description: 'Custom woven labels sewn into your garments for a premium, professional appearance. Perfect for fashion brands and retail products.',
    features: [
      'Custom woven with your branding',
      'Sewn in by our seamstresses',
      'Multiple placement options',
      'Durable and long-lasting',
    ],
    pricing: 'Contact for pricing',
  },
  {
    icon: ShoppingBag,
    title: 'Hang Tags',
    description: 'Custom hang tags attached to your garments for retail display. Include pricing, brand story, care instructions, or promotional messaging.',
    features: [
      'Custom printed hang tags',
      'Various attachment methods',
      'String or plastic fasteners',
      'Perfect for retail display',
    ],
    pricing: 'Contact for pricing',
  },
  {
    icon: Barcode,
    title: 'Barcoding & UPC',
    description: 'Add scannable barcodes and UPC codes for retail distribution. Essential for selling through retailers or managing inventory.',
    features: [
      'UPC/EAN barcode generation',
      'Integrated on hang tags or labels',
      'SKU management support',
      'Retail compliance ready',
    ],
    pricing: 'Contact for pricing',
  },
  {
    icon: Award,
    title: 'Relabeling Services',
    description: 'Complete removal of manufacturer labels and replacement with your custom branding. Our seamstress team handles cut-away and sewn labels.',
    features: [
      'Tear-away tag removal included',
      'Cut-away tag removal available',
      'Custom labels sewn in',
      'Clean, professional finish',
    ],
    pricing: 'Additional charges for cut-away',
  },
];

const whyRetailFinishing = [
  {
    title: 'Brand Consistency',
    description: 'Every piece that leaves our facility represents your brand exactly how you want it.',
  },
  {
    title: 'Retail Ready',
    description: 'Products arrive ready for store shelves or e-commerce fulfillment—no additional work needed.',
  },
  {
    title: 'Professional Presentation',
    description: 'First impressions matter. Retail finishing elevates the perceived value of your merchandise.',
  },
  {
    title: 'Time Savings',
    description: 'Let us handle the finishing details so you can focus on selling and growing your brand.',
  },
];

const shopCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Polos', href: '/catalog?category=52' },
  { name: 'All Products', href: '/catalog' },
];

export default function RetailFinishingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <ServiceHero
        title="Retail Finishing"
        tagline="Retail-Ready Merchandise"
        description="Transform decorated garments into retail-ready products. From fold and bag to custom woven labels, our finishing services add the professional touches that elevate your brand. Perfect for e-commerce, retail distribution, or premium merchandise drops."
        icon={Package}
        gradient="from-amber-500 to-orange-600"
        serviceSlug="retail-finishing"
        samplePrice="Starts at $1.00 at 100+ pieces"
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* Services Grid */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Our Finishing Services</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Add any of these services to your screen printing or embroidery order
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {finishingServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-800 mb-2">{service.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 font-medium">{service.pricing}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Relabeling Deep Dive */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
                Understanding Relabeling
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Relabeling replaces the manufacturer's tag with your custom branding. The process depends on the existing tag type:
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-bold text-navy-800 mb-2">Tear-Away Labels</h3>
                  <p className="text-slate-600 text-sm">
                    We remove tear-away labels free of charge. Note: small pieces may remain in the seam, and minor stitching damage on the backside is possible. This is normal and accepted.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-bold text-navy-800 mb-2">Cut-Away Labels</h3>
                  <p className="text-slate-600 text-sm">
                    Cut-away labels require our seamstress to unstitch and resew. An additional surcharge applies due to the extra labor involved.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-bold text-navy-800 mb-2">Screen Printed Neck Tags</h3>
                  <p className="text-slate-600 text-sm">
                    Screen printed directly over or in place of existing tags. Note: Heavy ink coverage on thin fabrics may show slight bleed-through. We default to light grey ink to minimize this.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Placeholder for relabeling image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden border border-amber-200">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Tag className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-sm text-amber-600 font-medium">Relabeling Example</p>
                  <p className="text-xs text-amber-500 mt-1">Image placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Retail Finishing */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Why Add Retail Finishing?</h2>
            <p className="mt-4 text-lg text-slate-600">The professional details that set your brand apart</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyRetailFinishing.map((reason, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 mx-auto mb-4">
                  <span className="text-xl font-bold">{index + 1}</span>
                </div>
                <h3 className="font-bold text-navy-800 mb-2">{reason.title}</h3>
                <p className="text-sm text-slate-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Combine With Services */}
      <section className="py-16 lg:py-20 bg-navy-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-brand-400 uppercase tracking-wider mb-2">
              Complete Solution
            </p>
            <h2 className="text-3xl font-bold text-white">Combine With Our Decoration Services</h2>
            <p className="mt-4 text-lg text-slate-300">
              Add retail finishing to any of our printing or embroidery services
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Screen Printing', href: '/services/screen-printing', description: 'Bold, durable prints' },
              { title: 'Embroidery', href: '/services/embroidery', description: 'Premium stitched logos' },
              { title: 'Digital Screen', href: '/services/digital-screen-printing', description: 'Full color prints' },
              { title: 'Simulated Process', href: '/services/simulated-process', description: 'Photorealistic prints' },
            ].map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="group bg-white/5 hover:bg-white/10 rounded-xl p-6 transition-colors"
              >
                <h3 className="font-semibold text-white mb-1">{service.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{service.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-brand-400 font-medium">
                  Learn More
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Ready to Get Started?"
        subtitle="Browse our catalog and add finishing services to your quote"
        categories={shopCategories}
      />

      {/* CTA */}
      <ServiceCTA
        title="Ready for Retail-Ready Merchandise?"
        subtitle="Get a quote within 24 hours. Ask about finishing add-ons."
        showRushBanner={true}
        serviceSlug="retail-finishing"
      />
    </div>
  );
}
