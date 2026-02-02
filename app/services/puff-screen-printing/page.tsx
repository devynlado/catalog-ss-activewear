'use client';

import { Sparkles, Box, Palette, Ruler, ThermometerSun, Shirt, Check } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
  TipsSection,
  PortfolioGrid,
  RetailFinishingUpsell,
  ServiceCTA,
  ServiceQuoteForm,
  ShopBlanksSection,
  WhyChooseSection,
} from '@/components/services';
import { getServiceImages } from '@/lib/service-images';

// Get images for this service
const serviceImages = getServiceImages('puff-printing');

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
    title: '14" x 16" Max Size',
    description: 'Large enough for impactful chest prints and back designs while maintaining the integrity of the puff effect.',
  },
  {
    icon: Check,
    title: 'Durable & Washable',
    description: 'Properly cured puff prints maintain their raised texture through countless washes.',
  },
];

const tips = [
  {
    title: 'Keep It Bold',
    description: 'Puff printing works best with bold, simple designs. Fine details and small text may not puff evenly.',
  },
  {
    title: 'Cotton Is King',
    description: 'Cotton and cotton-blend fabrics produce the best puff results. Avoid 100% polyester for optimal texture.',
  },
  {
    title: 'Consider Placement',
    description: 'Left chest, center chest, and back designs work great. Avoid areas with seams or pockets.',
  },
  {
    title: 'Limit Colors',
    description: 'While multi-color puff is possible, single-color designs produce the most consistent raised effect.',
  },
  {
    title: 'Combine With Flat',
    description: 'Mix puff and flat prints in one design for visual contrast and added dimension.',
  },
];

// Build portfolio items from service images
const portfolioItems = serviceImages?.gallery.map((img, index) => ({
  title: img.alt,
  tags: ['Puff', index % 2 === 0 ? '3D Effect' : 'Streetwear'],
  image: img.src,
  alt: img.alt,
})) || [];

const shopCategories = [
  { name: 'Cotton T-Shirts', href: '/catalog?category=21' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Crewneck Sweatshirts', href: '/catalog?category=9' },
  { name: 'Long Sleeve Tees', href: '/catalog?category=40' },
];

export default function PuffScreenPrintingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Puff Screen Printing"
        tagline="3D Raised Prints That Pop"
        description="Puff screen printing creates a raised, three-dimensional texture that adds tactile depth to your designs. Using specialized plastisol ink mixed with a puff additive, we create eye-catching prints with a soft, premium feel. Perfect for streetwear brands, fashion labels, and anyone looking to make their merch stand out."
        icon={Sparkles}
        gradient="from-purple-500 to-violet-600"
        maxPrintSize="14&quot; x 16&quot;"
        backLink={{ href: '/services/screen-printing', label: 'Back to Screen Printing' }}
        serviceSlug="puff-screen-printing"
        samplePrice="Starting at $3.35/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* How It Works */}
      <HowItWorks
        title="How Does Puff Screen Printing Work?"
        description="Puff screen printing uses a specialized plastisol ink that contains a foaming agent. When the printed garment passes through our conveyor dryer, the heat activates the foaming agent, causing the ink to expand and rise off the fabric. This creates a soft, raised texture that's both visually striking and pleasant to touch. The puff effect is permanent and maintains its shape through washing and wearing."
        steps={[
          { title: 'Design Preparation', description: 'Your artwork is optimized for puff printing, ensuring bold lines and adequate spacing for the raised effect.' },
          { title: 'Ink Mixing', description: 'We mix our high-quality plastisol with puff additive in precise ratios for optimal expansion.' },
          { title: 'Screen Creation', description: 'A special mesh count screen is created to deposit the right amount of ink for proper puffing.' },
          { title: 'Printing', description: 'The puff ink is carefully applied to ensure even coverage across the design.' },
          { title: 'Heat Activation', description: 'Garments pass through our dryer where heat activates the puff, creating the 3D effect.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Quote Form */}
      <ServiceQuoteForm
        service="puff-screen-printing"
        serviceName="Puff Screen Printing"
        headline="Ready for That 3D Look?"
        description="Puff printing that pops. Get connected with a dedicated rep — no obligation."
      />

      {/* What Makes Great Puff Design */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">What Makes a Great Puff Print?</h2>
            <p className="mt-4 text-lg text-slate-600">
              Not every design works well with puff printing. Here's what to consider for best results.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Good for Puff */}
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Check className="h-6 w-6" />
                Works Great with Puff
              </h3>
              <ul className="space-y-3 text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Bold text and typography</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Simple logos with clean lines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Solid shapes and filled areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Designs on cotton or cotton-blend fabrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Single or limited color designs</span>
                </li>
              </ul>
            </div>
            
            {/* Not Ideal for Puff */}
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Not Ideal for Puff
              </h3>
              <ul className="space-y-3 text-red-800">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Fine details or thin lines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Small text (under 1/4" tall)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Gradients or halftones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>100% polyester garments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Photo-realistic images</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Puff Screen Printing?"
        subtitle="Add dimension and premium feel to your merchandise"
        reasons={whyChooseReasons}
      />

      {/* Portfolio */}
      <PortfolioGrid
        title="Puff Printing Portfolio"
        subtitle="3D prints that make an impact"
        items={portfolioItems}
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for the Perfect Puff Print"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Puff-Ready Blanks"
        subtitle="Cotton and cotton-blend garments for the best puff results"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Puff Print Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready for 3D Puff Prints?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="puff-screen-printing"
      />
    </div>
  );
}
