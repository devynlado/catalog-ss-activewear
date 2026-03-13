'use client';

import Image from 'next/image';
import { Palette, Music, Camera, Droplets, Award, Layers, Check, Sparkles } from 'lucide-react';
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
const serviceImages = getServiceImages('simulated-process');

const whyChooseReasons = [
  {
    icon: Palette,
    title: 'Pantone Color Matching',
    description: 'Unlike digital methods, simulated process allows exact Pantone matching for brand-accurate colors.',
  },
  {
    icon: Camera,
    title: 'Photorealistic Results',
    description: 'Reproduce portraits, album art, and complex imagery with stunning detail and depth.',
  },
  {
    icon: Music,
    title: 'The Vintage Concert Tee Feel',
    description: 'That iconic, nostalgic look of classic band merch—soft ink, rich colors, timeless appeal.',
  },
  {
    icon: Layers,
    title: '17" x 23" Max Size',
    description: 'Larger than digital screen printing, giving you more canvas for impactful designs.',
  },
  {
    icon: Sparkles,
    title: 'Special Effects Available',
    description: 'Combine with puff, metallic, or high-density inks for added dimension.',
  },
  {
    icon: Droplets,
    title: 'Soft Hand Feel',
    description: 'Carefully controlled ink deposit creates a comfortable, wearable print.',
  },
];

const comparisonData = {
  columns: ['Simulated Process', 'Digital Screen Printing'],
  rows: [
    { feature: 'Definition', values: ['Halftones + spot colors for photorealistic prints', 'Digital print head for full CMYK color'] },
    { feature: 'Best For', values: ['Vibrant colors, vintage feel, Pantone matching', 'Photorealistic with complex color gradients'] },
    { feature: 'Color Accuracy', values: ['Pantone match any color', 'CMYK only, reduced vibrancy'] },
    { feature: 'Detail', values: ['Artistically interpreted', 'True-to-image'] },
    { feature: 'Max Print Size', values: ['17" x 23"', '15" x 18"'] },
    { feature: 'Special Effects', values: ['✓ Yes', '✗ No'] },
  ],
};

const tips = [
  {
    title: 'Be Flexible',
    description: 'Simulated process may require color adjustments. Trust your rep—minor tweaks often improve the final result.',
  },
  {
    title: 'Optimize Color Count',
    description: 'We balance design integrity with cost by reducing colors where possible. More colors = higher cost.',
  },
  {
    title: 'Leverage the Garment',
    description: 'Consider how the shirt color can replace ink colors in your design, creating a more cost-effective print.',
  },
  {
    title: 'Mind Ink Density',
    description: 'Lighter ink coverage gives a softer, more premium feel. We optimize for comfort and quality.',
  },
  {
    title: 'Expect Adjustments',
    description: 'Minor tweaks during setup are normal. Simulated process is an art as much as a science.',
  },
];

const simulatedFaqItems: ServiceFaqItem[] = [
  {
    q: 'What is the minimum order quantity for simulated process printing?',
    a: 'The minimum order quantity for custom simulated process printing is 50 pieces.',
  },
  {
    q: 'What factors affect the price of simulated process printing?',
    a: 'Simulated process printing prices are custom quoted per project. Pricing depends on several factors, including:\n\n• Garment type (e.g., t-shirts, sweatshirts, performance wear)\n• Number of print colors and print placements\n• Order quantity (larger simulated process printing orders receive volume discounts)',
  },
  {
    q: 'How long does simulated process printing production take?',
    a: 'Our standard simulated process printing production turnaround time is 10 business days from the date of final artwork approval and receipt of all blank garments.\n\nTurnaround time may vary depending on:\n\n• Current production volume\n• Order size and print complexity\n• Add-on services (relabeling, folding, bagging, etc.)\n• Shipping or delivery requirements',
  },
  {
    q: 'Can I see a sample or proof before production starts?',
    a: 'Absolutely. If you\'re undecided on which garment to use for your simulated process printing project, we strongly recommend ordering blank samples before proceeding with a full production run. This helps ensure you\'re confident in your garment selection before printing begins.',
  },
  {
    q: 'Do you offer bulk pricing for large simulated process printing orders?',
    a: 'Yes. We offer tiered pricing for bulk simulated process printing orders, meaning the more you order, the lower the cost per piece.\n\nOur minimum order is 50 pieces, with price breaks available at 75, 100, 150, 250, 500, and 1000 pieces.',
  },
  {
    q: 'Are you able to re-label a blank product?',
    a: 'Yes, we can re-label blank garments, but it\'s important to understand the type of label currently on the product to determine the best approach for rebranding.\n\nTear-Away Labels\nIf your shirts come with tear-away tags, we will remove them free of charge and print your custom neck label in its place.\n\nCut-Away Labels\nSome garments may come with cut-away labels, which are designed to be removed by cutting. While we can remove these as well, it requires additional labor and may incur additional charges.',
  },
  {
    q: 'Do you offer rush simulated process printing orders?',
    a: 'Yes. Rush simulated process printing orders are typically completed within 2–4 business days, depending on the scope of the project and our current production capacity.\n\nRush turnaround is contingent on the following:\n\n• Artwork approval and blank garment delivery must be finalized upfront\n• All order details (sizes, styles, and print specifications) must be confirmed with no revisions\n• Availability of your requested garments from our suppliers\n\nRush fees apply and are quoted based on order complexity, decoration method, and required ship or pickup date. Please contact your sales representative as early as possible to confirm if a rush production slot is available.\n\nRush jobs are scheduled on a first-come, first-served basis.',
  },
];

const shopCategories = [
  { name: 'T-Shirts', href: '/catalog?category=21' },
  { name: 'Heavyweight Tees', href: '/catalog?category=21' },
  { name: 'Hoodies', href: '/catalog?category=9' },
  { name: 'Long Sleeve Tees', href: '/catalog?category=40' },
];

export default function SimulatedProcessPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Simulated Process Printing"
        tagline="Photorealistic Prints with Vintage Soul"
        description="Simulated process screen printing reproduces full-color images—especially photorealistic artwork—using traditional screen printing techniques. By separating your design into a custom set of spot colors with halftones, we create stunning prints that pop on any shirt, especially dark ones. It's our go-to for anything complex, vivid, or requiring that nostalgic concert tee feel."
        icon={Palette}
        gradient="from-rose-500 to-pink-600"
        maxPrintSize="17&quot; x 23&quot;"
        backLink={{ href: '/services/screen-printing', label: 'Back to Screen Printing' }}
        serviceSlug="simulated-process"
        samplePrice="Starting at $3.35/piece"
        minimumOrder={50}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* How It Works */}
      <HowItWorks
        title="How Does Simulated Process Work?"
        description="Simulated process printing works by separating a full-color image into a custom set of spot colors. These colors are carefully chosen to reproduce gradients, shadows, highlights, and photorealistic details through halftones and layering techniques. Unlike digital printing (CMYK), simulated process uses Pantone-matched spot colors that can be more vibrant and precise. The end result is a soft-feel, photorealistic print with that iconic band tee quality."
        steps={[
          { title: 'Color Separation', description: 'Your artwork is analyzed and separated into individual spot colors optimized for screen printing.' },
          { title: 'Halftone Generation', description: 'Gradients and tones are converted to halftone patterns for smooth transitions.' },
          { title: 'Screen Creation', description: 'A separate screen is created for each color in the separation.' },
          { title: 'Print Sequence', description: 'Colors are printed in precise sequence, building up the image layer by layer.' },
          { title: 'Final Cure', description: 'The completed print is cured to bond all layers permanently to the fabric.' },
        ]}
        image={serviceImages?.gallery[0]}
      />

      {/* Quote Form */}
      <ServiceQuoteForm
        service="simulated-process"
        serviceName="Simulated Process Printing"
        headline="Photo-Realistic, Factory-Direct"
        description="Complex designs printed with precision. Connect with a dedicated rep."
      />

      {/* Tour Merch Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-600 mb-4">
                <Music className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Built for Artists</span>
              </div>
              <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
                Why Touring Artists Love Simulated Process
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Simulated process screen printing is the go-to for artists who want merch that looks as good as the album cover.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                From photorealistic portraits to moody gradients, this method brings complex art to life—especially on dark tees. It's built for tours, built for fans, built to last.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Reproduce album art with stunning accuracy',
                  'Vibrant colors that pop on black shirts',
                  'Durable prints that survive the mosh pit',
                  'That classic, vintage band tee aesthetic',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Tour merch image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-rose-200">
                {serviceImages?.gallery[1] ? (
                  <Image
                    src={serviceImages.gallery[1].src}
                    alt={serviceImages.gallery[1].alt}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <Music className="w-10 h-10 text-rose-500" />
                      </div>
                      <p className="text-sm text-rose-600 font-medium">Tour Merch Example</p>
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
        title="Simulated Process vs Digital Screen Printing"
        subtitle="Choose the right method for your artwork"
        columns={comparisonData.columns}
        rows={comparisonData.rows}
        highlightColumn={0}
      />

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Choose Simulated Process?"
        subtitle="For artwork that demands the best"
        reasons={whyChooseReasons}
      />

      {/* FAQ */}
      <ServiceFAQ
        title="Simulated Process Printing FAQ"
        subtitle="Common questions about our simulated process printing services"
        items={simulatedFaqItems}
      />

      {/* Portfolio */}
      <DynamicPortfolioGrid
        title="Simulated Process Portfolio"
        subtitle="Photorealistic prints with character"
        decorationSlug="simulated-process"
        limit={8}
        viewAllLink="/portfolio"
      />

      {/* Tips */}
      <TipsSection
        title="5 Tips for Simulated Process Printing"
        tips={tips}
      />

      {/* Shop Blanks */}
      <ShopBlanksSection
        title="Shop Simulated Process-Ready Blanks"
        subtitle="Dark garments work best for photorealistic prints"
        categories={shopCategories}
      />

      {/* Retail Finishing Upsell */}
      <RetailFinishingUpsell title="Upgrade Your Simulated Process Order" />

      {/* CTA */}
      <ServiceCTA
        title="Ready for Photorealistic Prints?"
        subtitle="Get a quote within 24 hours. 50 piece minimum."
        serviceSlug="simulated-process"
      />
    </div>
  );
}
