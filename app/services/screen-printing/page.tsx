'use client';

import Link from 'next/link';
import { Layers, ArrowRight, Sparkles, Maximize2, Monitor, Palette, Check, Thermometer, Shield, DollarSign } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
  ComparisonTable,
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
const serviceImages = getServiceImages('screen-printing');

// Metadata moved to layout or handled differently for client components

// Screen printing methods for the hub
const printingMethods = [
  {
    title: 'Standard Screen Printing',
    description: 'Classic plastisol ink printing. Bold, vibrant colors that last. Our most popular and cost-effective option for bulk orders.',
    icon: Layers,
    features: ['17" x 23" max size', 'Pantone matching', 'Special effects available', 'Best for: logos, text, bold graphics'],
    color: 'bg-brand-500',
    href: '#standard', // Stays on this page
  },
  {
    title: 'Puff Screen Printing',
    description: 'Raised 3D texture that pops off the garment. Creates a tactile, premium feel perfect for streetwear and fashion brands.',
    icon: Sparkles,
    features: ['14" x 16" max size', '3D raised effect', 'Soft, tactile finish', 'Best for: streetwear, logos'],
    color: 'bg-purple-500',
    href: '/services/puff-screen-printing',
  },
  {
    title: 'Jumbo Screen Printing',
    description: 'Oversized prints up to 17" x 23". Go bigger than industry standard for statement pieces and tour merch.',
    icon: Maximize2,
    features: ['17" x 23" max size', 'Full coverage prints', 'No seam restrictions', 'Best for: streetwear, tour merch'],
    color: 'bg-emerald-500',
    href: '/services/jumbo-screen-printing',
  },
  {
    title: 'Digital Screen Printing',
    description: 'Hybrid technology combining screen printing speed with digital color accuracy. Full-color, photo-realistic prints.',
    icon: Monitor,
    features: ['15" x 18" max size', 'Unlimited colors', 'No pretreatment', 'Best for: photorealistic, gradients'],
    color: 'bg-blue-500',
    href: '/services/digital-screen-printing',
  },
  {
    title: 'Simulated Process',
    description: 'Halftone technique for photorealistic prints using spot colors. The classic "vintage concert tee" look.',
    icon: Palette,
    features: ['17" x 23" max size', 'Pantone matching', 'Vintage feel', 'Best for: portraits, album art'],
    color: 'bg-rose-500',
    href: '/services/simulated-process',
  },
];

// Comparison data
const methodComparison = {
  columns: ['Standard', 'Puff', 'Jumbo', 'Digital', 'Simulated'],
  rows: [
    { feature: 'Max Print Size', values: ['17" x 23"', '14" x 16"', '17" x 23"', '15" x 18"', '17" x 23"'] },
    { feature: 'Best For', values: ['Logos, text', '3D effect', 'Oversized', 'Full color', 'Photorealistic'] },
    { feature: 'Color Matching', values: ['Pantone ✓', 'Limited', 'Pantone ✓', 'CMYK only', 'Pantone ✓'] },
    { feature: 'Special Effects', values: ['✓', '3D texture', '✓', '✗', '✓'] },
    { feature: 'Production Speed', values: ['Fast', 'Medium', 'Fast', 'Very Fast', 'Medium'] },
    { feature: 'Cost (bulk)', values: ['$', '$$', '$$', '$$', '$$'] },
  ],
};

const whyChooseReasons = [
  {
    icon: Thermometer,
    title: 'Properly Cured Prints',
    description: 'Every print is cured at 320-330°F for optimal durability. No cracking, peeling, or fading.',
  },
  {
    icon: Shield,
    title: 'Premium Plastisol Inks',
    description: 'We use industry-leading inks that deliver vibrant colors and withstand hundreds of washes.',
  },
  {
    icon: DollarSign,
    title: 'Factory Direct Pricing',
    description: 'No middleman markup. Price breaks at 75, 100, 250, 500, and 1,000+ pieces.',
  },
  {
    icon: Sparkles,
    title: 'Special Effects Available',
    description: 'Metallic, glitter, glow-in-dark, high-density, reflective, and more specialty inks.',
  },
  {
    icon: Palette,
    title: 'PMS Color Matching',
    description: 'Exact Pantone color matching ensures brand consistency across all your merchandise.',
  },
  {
    icon: Check,
    title: 'Quality Guaranteed',
    description: 'Every piece is inspected before shipping. We stand behind our work 100%.',
  },
];

const tips = [
  {
    title: 'Simplify Your Design',
    description: 'Fewer colors = lower cost. We can help optimize your artwork to reduce color count without sacrificing impact.',
  },
  {
    title: 'Leverage Garment Color',
    description: 'Use the shirt color as part of your design. A white design on a black shirt only needs one screen.',
  },
  {
    title: 'Vector Files Are Best',
    description: 'Submit artwork in AI, EPS, or PDF format. Raster images should be at least 300 DPI at print size.',
  },
  {
    title: 'Consider Placement',
    description: 'Standard placements (left chest, full front, full back) are most cost-effective. Custom placements available.',
  },
  {
    title: 'Plan for Bulk',
    description: 'Screen printing becomes more affordable at higher quantities. Our sweet spot is 100+ pieces.',
  },
];

// Build portfolio items from service images
const portfolioItems = serviceImages?.gallery.map((img, index) => ({
  title: img.alt,
  tags: ['Screen Printing', index % 2 === 0 ? 'Custom' : 'Streetwear'],
  image: img.src,
  alt: img.alt,
})) || [];

const shopCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Hoodies & Fleece', href: '/catalog?category=9' },
  { name: 'Tank Tops', href: '/catalog?category=63' },
  { name: 'Long Sleeves', href: '/catalog?category=40' },
  { name: 'Sweatshirts', href: '/catalog?category=9' },
];

export default function ScreenPrintingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Screen Printing"
        tagline="Bold, Vibrant Prints That Last"
        description="Screen printing is the gold standard for custom apparel. Using specialized inks pressed through mesh screens, we create vibrant, durable prints that stand up to countless washes. From simple one-color logos to complex multi-color designs, we have the method for your project."
        icon={Layers}
        gradient="from-brand-500 to-brand-700"
        maxPrintSize="Up to 17&quot; x 23&quot;"
        serviceSlug="screen-printing"
        samplePrice="Starting at $2.45/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* Choose Your Method Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              Choose Your Print Method
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Different projects call for different techniques. Here's how to pick the right screen printing method for your needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {printingMethods.map((method, index) => {
              const Icon = method.icon;
              const isCurrentPage = method.href === '#standard';
              
              return (
                <div
                  key={index}
                  className={`relative rounded-2xl bg-white border-2 p-6 transition-all ${
                    isCurrentPage 
                      ? 'border-brand-500 shadow-lg shadow-brand-500/10' 
                      : 'border-stone-100 hover:border-stone-200 hover:shadow-md'
                  }`}
                >
                  {isCurrentPage && (
                    <div className="absolute -top-3 left-6 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${method.color} text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-navy-800 mb-2">
                    {method.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4">
                    {method.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {method.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrentPage && (
                    <Link
                      href={method.href}
                      className="inline-flex items-center gap-2 text-brand-600 font-medium text-sm hover:text-brand-700 transition-colors"
                    >
                      Learn More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks
        title="How Does Screen Printing Work?"
        description="Screen printing uses a mesh screen with a stencil of your design. Ink is pushed through the open areas of the stencil onto the garment using a squeegee. Each color requires a separate screen, which is why simpler designs with fewer colors are more cost-effective. The ink is then heat-cured to bond permanently with the fabric, creating a durable print that withstands washing and wearing."
        steps={[
          { title: 'Artwork Preparation', description: 'We separate your design into individual colors and create film positives for each.' },
          { title: 'Screen Creation', description: 'Each color gets its own screen, coated with light-sensitive emulsion and exposed with your design.' },
          { title: 'Print Setup', description: 'Screens are mounted on the press, colors are mixed to match your specs, and registration is dialed in.' },
          { title: 'Production', description: 'Garments are loaded, printed, and flash-cured between colors for multi-color designs.' },
          { title: 'Final Cure', description: 'Prints pass through a conveyor dryer at 320-330°F to fully cure and ensure durability.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Quote Form */}
      <ServiceQuoteForm
        service="screen-printing"
        serviceName="Screen Printing"
        headline="Let's Talk About Your Order"
        description="Get factory-direct pricing on your screen printing project. We'll connect you with a dedicated rep."
      />

      {/* Method Comparison Table */}
      <ComparisonTable
        title="Compare Screen Printing Methods"
        subtitle="Find the right technique for your project"
        columns={methodComparison.columns}
        rows={methodComparison.rows}
        highlightColumn={0}
      />

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Garment Decor for Screen Printing?"
        subtitle="Over a decade of experience delivering quality prints"
        reasons={whyChooseReasons}
      />

      {/* Portfolio */}
      <PortfolioGrid
        title="Our Screen Printing Portfolio"
        subtitle="Real projects from real clients"
        items={portfolioItems}
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for a Successful Screen Print Order"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Screen Printing-Ready Blanks"
        subtitle="These products work great with screen printing"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Screen Print Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready to Start Your Screen Print Order?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="screen-printing"
      />
    </div>
  );
}
