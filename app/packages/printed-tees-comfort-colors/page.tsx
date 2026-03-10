import { Metadata } from 'next';
import { getProductBySlug } from '@/lib/product-cache';
import { PackageHero, WhatsIncluded, BenefitsRow, FAQSection, StickyMobileCTA } from '@/components/packages/shared';
import { ScreenPrintPackageBuilder, printedTeesComfortColorsPageConfig } from '@/components/packages/screenprinting';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom Printed Comfort Colors 1717 T-Shirts | All-Inclusive Pricing | Garment Decor',
  description: 'Get custom printed Comfort Colors 1717 garment-dyed t-shirts with all-inclusive pricing. Premium vintage feel, up to 2 colors included, no setup fees. Free shipping on orders $500+.',
  openGraph: {
    title: 'Custom Printed Comfort Colors 1717 T-Shirts | All-Inclusive Pricing',
    description: 'All-inclusive pricing includes up to 2 print colors, art setup, and screens. Premium garment-dyed vintage tees.',
    type: 'website',
  },
};

const { hero, whatsIncluded, benefits, faq, stickyMobileCta, productSlug } = printedTeesComfortColorsPageConfig;

export default async function PrintedTeesComfortColorsPage() {
  const product = await getProductBySlug('comfort-colors-1717');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <PackageHero {...hero} />
      
      {/* Package Builder - Main conversion section */}
      <section id="builder" className="py-12 lg:py-16 bg-gradient-to-b from-[#FAF6F3] to-stone-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ScreenPrintPackageBuilder 
            colors={product?.colors || []} 
            productStyleId={product?.styleId || 1717}
            productName={product?.title || 'Comfort Colors 1717 Garment-Dyed Heavyweight T-Shirt'}
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
