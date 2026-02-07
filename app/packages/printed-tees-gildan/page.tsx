import { Metadata } from 'next';
import { getProductBySlug } from '@/lib/product-cache';
import { PackageHero, WhatsIncluded, BenefitsRow, FAQSection, StickyMobileCTA } from '@/components/packages/shared';
import { ScreenPrintPackageBuilder, printedTeesGildanPageConfig } from '@/components/packages/screenprinting';

export const metadata: Metadata = {
  title: 'Custom Printed T-Shirts - Gildan 5000 | All-Inclusive Pricing | Garment Decor',
  description: 'Get custom printed Gildan 5000 t-shirts with all-inclusive pricing. Up to 2 colors included, no setup fees, no art charges. Free shipping on orders $500+. 5-7 day production.',
  openGraph: {
    title: 'Custom Printed T-Shirts - Gildan 5000 | All-Inclusive Pricing',
    description: 'All-inclusive pricing includes up to 2 print colors, art setup, and screens. No hidden fees.',
    type: 'website',
  },
};

const { hero, whatsIncluded, benefits, faq, stickyMobileCta, productSlug } = printedTeesGildanPageConfig;

export default async function PrintedTeesGildanPage() {
  const product = await getProductBySlug('gildan-5000');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <PackageHero {...hero} />
      
      {/* Package Builder - Main conversion section */}
      <section id="builder" className="py-12 lg:py-16 bg-gradient-to-b from-[#FAF6F3] to-stone-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ScreenPrintPackageBuilder 
            colors={product?.colors || []} 
            productStyleId={product?.styleID || 0}
            productName={product?.title || 'Gildan 5000 Heavy Cotton Tee'}
            productSlug={productSlug}
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
            Get a free quote with mockup of your design on the shirt. No obligation.
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
