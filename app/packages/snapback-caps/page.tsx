import { Metadata } from 'next';
import { getProductByStyleId } from '@/lib/product-cache';
import { PackageHero, WhatsIncluded, BenefitsRow, FAQSection, StickyMobileCTA } from '@/components/packages/shared';
import { EmbroideryPackageBuilder, snapbackCapsConfig, snapbackCapsPageConfig } from '@/components/packages/embroidery';

export const metadata: Metadata = {
  title: 'Custom Embroidered Snapback Caps - All-Inclusive Pricing | Garment Decor',
  description: 'Get custom embroidered snapback caps from $15.95/hat at 100+. All-inclusive pricing includes embroidery, digitizing, and pre-production sample. Mix colors at no extra charge. 10-day turnaround.',
  openGraph: {
    title: 'Custom Embroidered Snapback Caps - All-Inclusive Pricing',
    description: 'From $15.95/hat at 100+. Includes embroidery, digitizing & sample. Mix colors free.',
    type: 'website',
  },
};

const { hero, whatsIncluded, benefits, faq, stickyMobileCta, productStyleId } = snapbackCapsPageConfig;

export default async function SnapbackCapsPage() {
  const product = await getProductByStyleId(productStyleId);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <PackageHero {...hero} />
      
      {/* Package Builder - Main conversion section */}
      <section id="builder" className="py-12 lg:py-16 bg-gradient-to-b from-[#FAF6F3] to-stone-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <EmbroideryPackageBuilder 
            colors={product?.colors || []} 
            productStyleId={product?.styleId || productStyleId}
            productName={product?.title || 'Yupoong 6089M Snapback Cap'}
            config={snapbackCapsConfig}
          />
        </div>
      </section>
      
      {/* What's Included */}
      <WhatsIncluded 
        description={whatsIncluded.description}
        items={whatsIncluded.items}
        pricingTable={whatsIncluded.pricingTable}
      />
      
      {/* Benefits Row */}
      <BenefitsRow 
        description={benefits.description}
        benefits={benefits.benefits}
      />
      
      {/* FAQ Section */}
      <FAQSection 
        description={faq.description}
        faqs={faq.faqs}
      />
      
      {/* Not Ready CTA */}
      <section className="py-16 bg-gradient-to-b from-stone-100 to-[#FAF6F3]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Not Ready to Order?</h2>
          <p className="text-stone-600 mb-6">
            Get a free quote with mockup of your logo on the cap. No obligation.
          </p>
          <a
            href="/quote"
            className="inline-flex items-center justify-center px-8 py-3 bg-navy-900 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/25"
          >
            Get a Free Quote
          </a>
        </div>
      </section>
      
      {/* Sticky Mobile CTA */}
      <StickyMobileCTA priceText={stickyMobileCta.priceText} />
    </div>
  );
}
