'use client';

import { Maximize2, Shirt, Palette, Check, Zap, Award, Users } from 'lucide-react';
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
const serviceImages = getServiceImages('jumbo-screen-printing');

const whyChooseReasons = [
  {
    icon: Maximize2,
    title: '17" x 23" Max Print Size',
    description: 'Go bigger than the industry standard 14" max. Our oversized capability lets your designs make a statement.',
  },
  {
    icon: Shirt,
    title: 'No Seam Restrictions',
    description: 'Unlike many shops, we can print edge-to-edge without being limited by side seams.',
  },
  {
    icon: Palette,
    title: 'All Print Methods Available',
    description: 'Combine jumbo sizing with plastisol, puff, metallic, or any of our specialty inks.',
  },
  {
    icon: Zap,
    title: 'Same Turnaround',
    description: 'Jumbo prints don\'t add extra production time. Get your oversized merch just as fast.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Large prints require precision. Our experienced team ensures perfect registration on every piece.',
  },
  {
    icon: Users,
    title: 'Streetwear Expertise',
    description: 'We work with hundreds of streetwear brands. We understand the aesthetic you\'re going for.',
  },
];

const comparisonData = {
  columns: ['Garment Decor', 'Industry Standard'],
  rows: [
    { feature: 'Maximum Width', values: ['17 inches', '14 inches'] },
    { feature: 'Maximum Height', values: ['23 inches', '16 inches'] },
    { feature: 'Full Back Coverage', values: ['✓ Yes', 'Limited'] },
    { feature: 'Edge-to-Edge', values: ['✓ Yes', 'Often restricted'] },
    { feature: 'Side Seam Printing', values: ['✓ Available', 'Usually not offered'] },
    { feature: 'All-Over Prints', values: ['✓ Supported', 'Rarely available'] },
  ],
};

const tips = [
  {
    title: 'Design to Scale',
    description: 'Create your artwork at actual print size (17" x 23" at 300 DPI) to ensure quality at large scale.',
  },
  {
    title: 'Consider Garment Size',
    description: 'A 17" wide print looks different on a Small vs. 3XL. We can help you plan sizing across your size run.',
  },
  {
    title: 'Bold Works Best',
    description: 'Large prints demand bold graphics. This is your chance to make a statement—go big with your design.',
  },
  {
    title: 'Mind the Placement',
    description: 'Full back prints typically start 3" below the collar. Let us know your preferred positioning.',
  },
  {
    title: 'Leverage Special Effects',
    description: 'Combine jumbo sizing with puff, metallic, or high-density inks for extra impact.',
  },
];

// Build portfolio items from service images
const portfolioItems = serviceImages?.gallery.map((img, index) => ({
  title: img.alt,
  tags: ['Jumbo', index % 2 === 0 ? 'Oversized' : 'Streetwear'],
  image: img.src,
  alt: img.alt,
})) || [];

const shopCategories = [
  { name: 'Heavyweight T-Shirts', href: '/catalog?category=21' },
  { name: 'Oversized Tees', href: '/catalog?category=21' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Long Sleeve Tees', href: '/catalog?category=40' },
  { name: 'Crewneck Sweatshirts', href: '/catalog?category=9' },
];

export default function JumboScreenPrintingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Jumbo Screen Printing"
        tagline="Go Big, Make a Statement"
        description="When standard print sizes aren't enough, go jumbo. Our oversized screen printing capability allows for prints up to 17 inches wide by 23 inches tall—far exceeding the industry standard of 14 inches. Create statement pieces, full back graphics, and all-over prints that demand attention."
        icon={Maximize2}
        gradient="from-emerald-500 to-teal-600"
        maxPrintSize="17&quot; x 23&quot;"
        backLink={{ href: '/services/screen-printing', label: 'Back to Screen Printing' }}
        serviceSlug="jumbo-screen-printing"
        samplePrice="Starting at $3.75/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* How It Works */}
      <HowItWorks
        title="How Does Jumbo Screen Printing Work?"
        description="Jumbo screen printing uses the same proven techniques as standard screen printing, just on a larger scale. We use oversized screens and specialized equipment designed to handle bigger print areas while maintaining perfect registration and ink coverage. The process is the same—artwork prep, screen creation, printing, and curing—but everything is scaled up to accommodate your bigger vision."
        steps={[
          { title: 'Artwork Scaling', description: 'Your design is prepared at full size, ensuring every detail remains crisp at jumbo scale.' },
          { title: 'Oversized Screens', description: 'We create larger-than-standard screens to accommodate the full print area.' },
          { title: 'Precision Setup', description: 'Large prints require extra attention to registration. We dial in every detail.' },
          { title: 'Controlled Printing', description: 'Even ink coverage across the entire print area for consistent results.' },
          { title: 'Full Cure', description: 'Extended time in our conveyor dryer ensures complete curing across the larger print area.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Quote Form */}
      <ServiceQuoteForm
        service="jumbo-screen-printing"
        serviceName="Jumbo Screen Printing"
        headline="Oversized Prints, Wholesale Pricing"
        description="Full-coverage and all-over prints up to 16&quot; x 20&quot;. Connect with a dedicated rep."
      />

      {/* Size Comparison */}
      <ComparisonTable
        title="Jumbo vs. Standard Print Sizing"
        subtitle="See how our capabilities exceed industry standard"
        columns={comparisonData.columns}
        rows={comparisonData.rows}
        highlightColumn={0}
      />

      {/* Use Cases Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800">Perfect For</h2>
            <p className="mt-4 text-lg text-slate-600">
              Jumbo screen printing is the go-to choice for these applications
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Tour Merch', description: 'Album art, tour dates, bold artist branding' },
              { title: 'Streetwear', description: 'Oversized graphics, statement pieces, lookbook pieces' },
              { title: 'Festivals & Events', description: 'Eye-catching designs for large-scale events' },
              { title: 'Fashion Labels', description: 'Runway-ready pieces with maximum visual impact' },
            ].map((item, index) => (
              <div key={index} className="bg-stone-50 rounded-xl p-6 text-center">
                <h3 className="font-bold text-navy-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Jumbo Screen Printing?"
        subtitle="When bigger is better"
        reasons={whyChooseReasons}
      />

      {/* Portfolio */}
      <PortfolioGrid
        title="Jumbo Print Portfolio"
        subtitle="Oversized prints that make an impact"
        items={portfolioItems}
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for Great Jumbo Prints"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Jumbo-Ready Blanks"
        subtitle="Heavyweight and oversized garments for maximum impact"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Jumbo Print Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready to Go Jumbo?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="jumbo-screen-printing"
      />
    </div>
  );
}
