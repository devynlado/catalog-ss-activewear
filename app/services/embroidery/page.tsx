'use client';

import Link from 'next/link';
import { Scissors, Award, Palette, Shield, Box, Shirt, Check, Ruler, ArrowRight } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
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
const serviceImages = getServiceImages('embroidery');

const whyChooseReasons = [
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Clean stitch work, precise registration, and attention to detail on every piece.',
  },
  {
    icon: Box,
    title: '3D Puff Embroidery',
    description: 'Add dimension to your logo with raised puff embroidery that stands out.',
  },
  {
    icon: Palette,
    title: 'Extensive Thread Library',
    description: 'We use Madeira Polyneon thread with hundreds of colors to match your brand.',
  },
  {
    icon: Ruler,
    title: '15.7" x 16.5" Max Size',
    description: 'Large enough for full back embroidery on jackets and hoodies.',
  },
  {
    icon: Shield,
    title: 'Built to Last',
    description: 'Embroidery is the most durable decoration method—no fading, cracking, or peeling.',
  },
  {
    icon: Shirt,
    title: 'Works on Any Fabric',
    description: 'From cotton polos to nylon jackets to structured caps—we embroider it all.',
  },
];

const backingTypes = [
  {
    name: 'Tearaway Backing',
    description: 'For stable, woven fabrics like cotton. Easy to remove after stitching.',
    bestFor: 'Polos, dress shirts, heavy cotton',
  },
  {
    name: 'Cutaway Backing',
    description: 'Provides permanent support for stretchy or unstable fabrics.',
    bestFor: 'Performance wear, knits, fleece',
  },
  {
    name: 'Water-Soluble Backing',
    description: 'Dissolves completely, leaving no residue behind.',
    bestFor: 'Delicate fabrics, towels, baby items',
  },
];

const tips = [
  {
    title: 'Vector Files Are Best',
    description: 'Submit your logo in AI, EPS, or PDF format. We\'ll handle the digitization for embroidery.',
  },
  {
    title: 'Simplify Small Details',
    description: 'Thread can\'t replicate tiny details. We\'ll optimize your design for best stitch results.',
  },
  {
    title: 'Consider Stitch Count',
    description: 'More stitches = longer production time = higher cost. Let us help optimize your design.',
  },
  {
    title: 'Choose the Right Garment',
    description: 'Structured fabrics like pique polo and twill caps produce the cleanest embroidery.',
  },
  {
    title: 'Plan Your Placements',
    description: 'Left chest is most popular, but we also do right chest, sleeve, back, and cap front.',
  },
];


const embroideryFaqItems: ServiceFaqItem[] = [
  {
    q: 'What is the minimum order quantity for embroidery?',
    a: 'The minimum order quantity for custom embroidery is 50 pieces.',
  },
  {
    q: 'What factors affect the price of embroidery?',
    a: 'Embroidery prices are custom quoted per project. Pricing depends on several factors, including:\n\n• Garment type (e.g., t-shirts, sweatshirts, performance wear)\n• Number of colors and placements\n• Order quantity (larger embroidery orders receive volume discounts)',
  },
  {
    q: 'How long does embroidery production take?',
    a: 'Our standard embroidery production turnaround time is 10 business days from the date of final artwork approval and receipt of all blank garments.\n\nTurnaround time may vary depending on:\n\n• Current production volume\n• Order size and complexity\n• Add-on services (relabeling, folding, bagging, etc.)\n• Shipping or delivery requirements',
  },
  {
    q: 'Can I see a sample or proof before production starts?',
    a: 'Absolutely. If you\'re undecided on which garment to use for your embroidery project, we strongly recommend ordering blank samples before proceeding with a full production run. This helps ensure you\'re confident in your garment selection before printing begins.',
  },
  {
    q: 'Do you offer bulk pricing for large embroidery orders?',
    a: 'Yes. We offer tiered pricing for bulk embroidery orders, meaning the more you order, the lower the cost per piece.\n\nOur minimum order is 50 pieces, with price breaks available at 75, 100, 150, 250, 500, and 1000 pieces.',
  },
  {
    q: 'Are you able to re-label a blank product?',
    a: 'Yes, we can re-label blank garments, but it\'s important to understand the type of label currently on the product to determine the best approach for rebranding.\n\nTear-Away Labels\nIf your shirts come with tear-away tags, we will remove them free of charge and print your custom neck label in its place.\n\nCut-Away Labels\nSome garments may come with cut-away labels, which are designed to be removed by cutting. While we can remove these as well, it requires additional labor and may incur additional charges.',
  },
  {
    q: 'Do you offer rush embroidery orders?',
    a: 'Yes. Rush embroidery orders are typically completed within 2–4 business days, depending on the scope of the project and our current production capacity.\n\nRush turnaround is contingent on the following:\n\n• Artwork approval and blank garment delivery must be finalized upfront\n• All order details (sizes, styles, and print specifications) must be confirmed with no revisions\n• Availability of your requested garments from our suppliers\n\nRush fees apply and are quoted based on order complexity, decoration method, and required ship or pickup date. Please contact your sales representative as early as possible to confirm if a rush production slot is available.\n\nRush jobs are scheduled on a first-come, first-served basis.',
  },
];

const shopCategories = [
  { name: 'Polos', href: '/catalog?category=52' },
  { name: 'Caps & Hats', href: '/catalog?category=11' },
  { name: 'Jackets', href: '/catalog?category=15' },
  { name: 'Quarter-Zips', href: '/catalog?category=15' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Beanies', href: '/catalog?category=11' },
];

export default function EmbroideryPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Custom Embroidery"
        tagline="Premium Stitched Logos & Designs"
        description="Embroidery adds a touch of class to any garment. Our state-of-the-art machines stitch your logo or design directly into the fabric, creating a professional, high-end look that lasts forever. From corporate polos to streetwear caps, embroidery is the gold standard for premium branding."
        icon={Scissors}
        gradient="from-indigo-500 to-purple-600"
        maxPrintSize="15.7&quot; x 16.5&quot;"
        serviceSlug="embroidery"
        samplePrice="Starting at $4.25/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* How It Works */}
      <HowItWorks
        title="How Does Embroidery Work?"
        description="Embroidery is the process of stitching thread into fabric to create a design. We use commercial-grade multi-head embroidery machines that can stitch thousands of stitches per minute with precise accuracy. Your logo is first converted into a 'digitized' file that tells the machine exactly where to place each stitch, what color thread to use, and in what order. The result is a permanent, professional decoration that won't fade, crack, or peel."
        steps={[
          { title: 'Digitization', description: 'Your logo is converted into an embroidery file with precise stitch mapping.' },
          { title: 'Thread Selection', description: 'We match Madeira Polyneon thread colors to your brand guidelines.' },
          { title: 'Backing Selection', description: 'We choose the right backing (tearaway, cutaway, or water-soluble) for your fabric.' },
          { title: 'Machine Setup', description: 'Your design is loaded and the garment is hooped for precise placement.' },
          { title: 'Embroidery', description: 'Our multi-head machines stitch your design with precision and speed.' },
          { title: 'Finishing', description: 'Backing is trimmed, loose threads are removed, and items are steamed.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Quote Form */}
      <ServiceQuoteForm
        service="embroidery"
        serviceName="Custom Embroidery"
        headline="Get Your Embroidery Quote"
        description="Professional embroidery from 50 to 10,000+ pieces. We'll connect you with a dedicated rep."
      />

      {/* Embroidery Types */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Embroidery Styles</h2>
            <p className="mt-4 text-lg text-slate-600">Choose the right technique for your project</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Flat Embroidery */}
            <div className="bg-stone-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Scissors className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-800">Flat Embroidery</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Traditional embroidery where thread lies flat against the fabric. Clean, professional, and versatile.
              </p>
              <ul className="space-y-2">
                {['Works on all garment types', 'Best for detailed logos', 'Most cost-effective option', 'Clean, professional finish'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 3D Puff Embroidery */}
            <div className="bg-stone-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Box className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-800">3D Puff Embroidery</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Raised embroidery with foam backing for a bold, dimensional look. Popular for caps and streetwear.
              </p>
              <ul className="space-y-2">
                {['Eye-catching 3D effect', 'Perfect for bold logos', 'Best on structured caps', 'Premium, tactile finish'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Backing Types */}
      <section className="py-16 lg:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Backing Types</h2>
            <p className="mt-4 text-lg text-slate-600">We select the right backing for your fabric and application</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {backingTypes.map((backing, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-navy-800 mb-2">{backing.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{backing.description}</p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Best for:</span> {backing.bestFor}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Embroidery?"
        subtitle="The premium choice for professional branding"
        reasons={whyChooseReasons}
      />

      {/* FAQ */}
      <ServiceFAQ
        title="Embroidery FAQ"
        subtitle="Common questions about our custom embroidery services"
        items={embroideryFaqItems}
      />

      {/* Portfolio */}
      <DynamicPortfolioGrid
        title="Embroidery Portfolio"
        subtitle="Precision stitching for every application"
        decorationSlug="embroidery"
        limit={8}
        viewAllLink="/portfolio"
      />

      {/* Most Popular Blank for Embroidery */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white overflow-hidden">
            <div className="grid md:grid-cols-5 gap-0">
              <div className="md:col-span-2 relative h-48 md:h-auto">
                <img
                  src="/images/services/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp"
                  alt="LA Apparel 1801GD blank for custom embroidery"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-3 p-6 lg:p-8 flex flex-col justify-center">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Most Popular Blank for Embroidery</span>
                <h3 className="text-xl font-bold text-navy-800 mb-2">Los Angeles Apparel 1801GD</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Our #1 selling blank. The 6.5oz garment-dyed heavyweight cotton is thick enough to hold embroidery stitches cleanly without puckering — perfect for left chest logos, back yoke designs, and more.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/blanks/los-angeles-apparel-1801gd" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
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
        title="5 Tips for Great Embroidery"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Embroidery-Ready Blanks"
        subtitle="These garments work great with embroidery"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Embroidery Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready for Premium Embroidery?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="embroidery"
      />
    </div>
  );
}
