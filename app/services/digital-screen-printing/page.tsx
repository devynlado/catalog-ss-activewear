'use client';

import Image from 'next/image';
import { Monitor, Zap, Palette, Droplets, Clock, DollarSign, Check, Cpu } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
  ComparisonTable,
  TipsSection,
  PortfolioGrid,
  RetailFinishingUpsell,
  ServiceCTA,
  ShopBlanksSection,
  WhyChooseSection,
} from '@/components/services';
import { getServiceImages } from '@/lib/service-images';

// Get images for this service
const serviceImages = getServiceImages('digital-screen-printing');

const whyChooseReasons = [
  {
    icon: Zap,
    title: '400 Garments Per Hour',
    description: 'Our hybrid process is 8x faster than traditional DTG, making it ideal for bulk orders.',
  },
  {
    icon: Palette,
    title: 'Unlimited Colors',
    description: 'Full CMYK color range means unlimited colors at no extra cost. Perfect for gradients and photos.',
  },
  {
    icon: Droplets,
    title: 'Water-Based Soft Feel',
    description: 'Unlike plasticky DTF transfers, our water-based inks feel soft and breathable on the fabric.',
  },
  {
    icon: Check,
    title: 'No Pretreatment Required',
    description: 'Unlike DTG, our process doesn\'t require chemical pretreatment of garments.',
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    description: 'High production speed means we can turn around large orders faster than traditional methods.',
  },
  {
    icon: DollarSign,
    title: '2x Better Pricing vs DTG',
    description: 'At bulk quantities, digital screen printing can cost half what DTG charges.',
  },
];

const comparisonData = {
  columns: ['Digital Screen Printing', 'DTG/DTF'],
  rows: [
    { feature: 'Print Speed', values: ['400 garments/hour', '50 garments/hour'] },
    { feature: 'Feel of Print', values: ['Water-based, soft finish', 'Sticker-like, plasticky feel'] },
    { feature: 'Best For', values: ['Full color, photo-realistic in bulk', 'Low qty orders, samples'] },
    { feature: 'Pre-Treatment', values: ['Not required', 'Required for DTG'] },
    { feature: 'Durability', values: ['Identical to screen print', 'Good, varies by vendor'] },
    { feature: 'Cost at 100+ pcs', values: ['Very competitive', '~2x more expensive'] },
  ],
};

const tips = [
  {
    title: 'Prepare Artwork in CMYK',
    description: 'Submit your files in CMYK color mode for most accurate color reproduction. RGB will be converted.',
  },
  {
    title: 'High Resolution Required',
    description: 'Artwork should be at least 300 DPI at final print size. Vector files (AI, EPS, PDF) are ideal.',
  },
  {
    title: 'Consider Light Garments',
    description: 'While we can print on darks, light-colored garments produce the most vibrant results.',
  },
  {
    title: 'Maximize the Print Area',
    description: 'Our max size is 15" x 18"—plenty of room for impactful designs.',
  },
  {
    title: 'Plan for Volume',
    description: 'Digital screen printing shines at 50+ pieces. The more you order, the better the per-piece price.',
  },
];

// Build portfolio items from service images
const portfolioItems = serviceImages?.gallery.map((img, index) => ({
  title: img.alt,
  tags: ['Digital', index % 2 === 0 ? 'Full Color' : 'Custom'],
  image: img.src,
  alt: img.alt,
})) || [];

const shopCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Tank Tops', href: '/catalog?category=63' },
  { name: 'Long Sleeve Tees', href: '/catalog?category=40' },
];

export default function DigitalScreenPrintingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Digital Screen Printing"
        tagline="Unlimited Colors, Infinite Possibilities"
        description="Digital screen printing is a hybrid technology that combines traditional screen printing with digital printing. We apply a water-based white under base using a screen, then a digital printer lays down full-color detail on top. The result? Photorealistic prints with the speed of screen printing and the soft feel of water-based inks."
        icon={Monitor}
        gradient="from-blue-500 to-indigo-600"
        maxPrintSize="15&quot; x 18&quot;"
        backLink={{ href: '/services/screen-printing', label: 'Back to Screen Printing' }}
        serviceSlug="digital-screen-printing"
        samplePrice="Starting at $5.50/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* How It Works */}
      <HowItWorks
        title="How Does Digital Screen Printing Work?"
        description="Digital screen printing begins with a base layer of water-based white ink applied using a traditional screen. Then, our digital printer lays the full-color CMYK design directly on top of this base. This hybrid approach combines the production speed of screen printing with the full-color capabilities of digital printing. The result is a soft, breathable print with photorealistic detail—achieved at speeds up to 400 garments per hour."
        steps={[
          { title: 'File Preparation', description: 'Your high-resolution artwork is color-profiled and optimized for CMYK output.' },
          { title: 'White Base Application', description: 'A water-based white underbase is screen printed to create an anchor for the digital ink.' },
          { title: 'Digital Color Layer', description: 'The full-color design is printed digitally on top of the white base.' },
          { title: 'Curing', description: 'Prints pass through a gas conveyor dryer for 2+ minutes to fully cure and bond with the fabric.' },
          { title: 'Quality Check', description: 'Every piece is inspected for color accuracy and print quality before packing.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Technology Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-600 mb-4">
                <Cpu className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Cutting-Edge Technology</span>
              </div>
              <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
                Is Digital Screen Printing New?
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Yes—and Garment Decor is proud to be one of the first companies in the nation to adopt this technology.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                This advanced system requires a significant investment, which is why only a select few companies across the country have it. Despite its superior capabilities, it remains relatively unknown due to its complexity and the high investment required.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                By choosing digital screen printing at Garment Decor, you're getting access to cutting-edge technology that most print shops simply can't offer.
              </p>
            </div>
            
            {/* Technology image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-blue-200">
                {serviceImages?.gallery[1] ? (
                  <Image
                    src={serviceImages.gallery[1].src}
                    alt={serviceImages.gallery[1].alt}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Monitor className="w-10 h-10 text-blue-500" />
                      </div>
                      <p className="text-sm text-blue-600 font-medium">Digital Screen Printing Machine</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable
        title="Digital Screen Printing vs DTG/DTF"
        subtitle="See how our hybrid process compares to traditional digital methods"
        columns={comparisonData.columns}
        rows={comparisonData.rows}
        highlightColumn={0}
      />

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Digital Screen Printing?"
        subtitle="The best of both worlds: speed and full-color capability"
        reasons={whyChooseReasons}
      />

      {/* Technical Specs */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Technical Specifications</h2>
            <p className="mt-4 text-lg text-slate-600">Everything you need to know for your project</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Max Print Size', value: '15" x 18"' },
              { label: 'Artwork Format', value: 'CMYK, 300 DPI' },
              { label: 'Cure Time', value: '2 min 30 sec' },
              { label: 'Production Speed', value: '400/hour' },
            ].map((spec, index) => (
              <div key={index} className="bg-stone-50 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider">{spec.label}</p>
                <p className="mt-2 text-2xl font-bold text-navy-800">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <PortfolioGrid
        title="Digital Screen Printing Portfolio"
        subtitle="Full-color prints that make an impact"
        items={portfolioItems}
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for Digital Screen Printing"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Digital Print-Ready Blanks"
        subtitle="These garments work great with digital screen printing"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Digital Print Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready for Full-Color Digital Prints?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="digital-screen-printing"
      />
    </div>
  );
}
