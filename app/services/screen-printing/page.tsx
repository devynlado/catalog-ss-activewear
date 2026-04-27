'use client';

import Link from 'next/link';
import { Layers, ArrowRight, Sparkles, Maximize2, Monitor, Palette, Check, Thermometer, Shield, DollarSign } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
  ComparisonTable,
  TipsSection,
  DynamicPortfolioGrid,
  RetailFinishingUpsell,
  ServiceCTA,
  ServiceQuoteForm,
  ShopBlanksSection,
  WhyChooseSection,
  ServiceFAQ,
} from '@/components/services';
import type { ServiceFaqItem } from '@/components/services';
import { getServiceImages } from '@/lib/service-images';

// Get images for this service
const serviceImages = getServiceImages('screen-printing');

const screenPrintingFaqItems: ServiceFaqItem[] = [
  {
    q: 'What is the minimum order quantity for screen printing?',
    a: 'The minimum order quantity for custom screen printing is 50 pieces.',
  },
  {
    q: 'What factors affect the price of screen printing?',
    a: 'Screen printing prices are custom quoted per project. Pricing depends on several factors, including:\n\n• Garment type (e.g., t-shirts, sweatshirts, performance wear)\n• Number of print colors and print placements\n• Order quantity (larger screen printing orders receive volume discounts)',
  },
  {
    q: 'How long does screen printing production take?',
    a: 'Our standard screen printing production turnaround time is 10 business days from the date of final artwork approval and receipt of all blank garments.\n\nTurnaround time may vary depending on:\n\n• Current production volume\n• Order size and print complexity\n• Add-on services (relabeling, folding, bagging, etc.)\n• Shipping or delivery requirements',
  },
  {
    q: 'Can I see a sample or proof before production starts?',
    a: 'Absolutely. If you\'re undecided on which garment to use for your screen printing project, we strongly recommend ordering blank samples before proceeding with a full production run. This helps ensure you\'re confident in your garment selection before printing begins.',
  },
  {
    q: 'Do you offer bulk pricing for large screen printing orders?',
    a: 'Yes. We offer tiered pricing for bulk screen printing orders, meaning the more you order, the lower the cost per piece.\n\nOur minimum order is 50 pieces, with price breaks available at 75, 100, 150, 250, 500, and 1000 pieces.',
  },
  {
    q: 'Are you able to re-label a blank product?',
    a: 'Yes, we can re-label blank garments, but it\'s important to understand the type of label currently on the product to determine the best approach for rebranding.\n\nTear-Away Labels\nIf your shirts come with tear-away tags, we will remove them free of charge and print your custom neck label in its place.\n\nCut-Away Labels\nSome garments may come with cut-away labels, which are designed to be removed by cutting. While we can remove these as well, it requires additional labor and may incur additional charges.',
  },
  {
    q: 'Do you offer rush screen printing orders?',
    a: 'Yes. Rush screen printing orders are typically completed within 2–4 business days, depending on the scope of the project and our current production capacity.\n\nRush turnaround is contingent on the following:\n\n• Artwork approval and blank garment delivery must be finalized upfront\n• All order details (sizes, styles, and print specifications) must be confirmed with no revisions\n• Availability of your requested garments from our suppliers\n\nRush fees apply and are quoted based on order complexity, decoration method, and required ship or pickup date. Please contact your sales representative as early as possible to confirm if a rush production slot is available.\n\nRush jobs are scheduled on a first-come, first-served basis.',
  },
];

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

      {/* FAQ */}
      <ServiceFAQ
        title="Screen Printing FAQ"
        subtitle="Common questions about our screen printing services"
        items={screenPrintingFaqItems}
      />

      {/* Portfolio */}
      <DynamicPortfolioGrid
        title="Our Screen Printing Portfolio"
        subtitle="Real projects from real clients"
        decorationSlug={[
          'screen-printing',
          'puff-screen-printing',
          'jumbo-screen-printing',
          'digital-screen-printing',
          'simulated-process',
        ]}
        limit={8}
        viewAllLink="/portfolio"
      />

      {/* Most Popular Blank for Screen Printing */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white overflow-hidden">
            <div className="grid md:grid-cols-5 gap-0">
              <div className="md:col-span-2 relative h-48 md:h-auto">
                <img
                  src="/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp"
                  alt="Custom screen printing on LA Apparel 1801GD"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-3 p-6 lg:p-8 flex flex-col justify-center">
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Most Popular Blank for Screen Printing</span>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Los Angeles Apparel 1801GD</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Our #1 selling blank. 6.5oz garment-dyed heavyweight cotton made in LA — the gold standard for premium screen printing. Dense fabric, zero bleed-through, incredible hand-feel.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/blanks/los-angeles-apparel-1801gd" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                    Customize the 1801GD <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/product/los-angeles-apparel-1801gd" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800">
                    Buy blanks <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
