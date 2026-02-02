'use client';

import { Scissors, Award, Palette, Shield, Box, Shirt, Check, Ruler } from 'lucide-react';
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

// Build portfolio items from service images
const portfolioItems = serviceImages?.gallery.map((img, index) => ({
  title: img.alt,
  tags: ['Embroidery', index % 2 === 0 ? 'Custom' : 'Headwear'],
  image: img.src,
  alt: img.alt,
})) || [];

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

      {/* Portfolio */}
      <PortfolioGrid
        title="Embroidery Portfolio"
        subtitle="Precision stitching for every application"
        items={portfolioItems}
      />

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
