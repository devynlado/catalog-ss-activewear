import type { Metadata } from 'next';
import { StreetWearHero } from './_components/StreetWearHero';
import { ProductGrid } from './_components/ProductGrid';
import { FloatingInquiryBar } from './_components/FloatingInquiryBar';
import { HowItWorks } from './_components/HowItWorks';
import { DecorationMethods } from './_components/DecorationMethods';
import { StreetWearForm } from './_components/StreetWearForm';
import { PackagesCTA } from './_components/PackagesCTA';

export const metadata: Metadata = {
  title: 'Cut & Sew Sourcing With Garment Decor | Custom Manufacturing',
  description:
    'Source custom-manufactured streetwear — heavyweight tees, hoodies, joggers & more — with transparent per-unit pricing. 100pc minimums. Screen printing, embroidery, puff print, and rhinestone available.',
  openGraph: {
    title: 'Cut & Sew Sourcing With Garment Decor',
    description:
      'Source custom streetwear with transparent pricing. Heavyweight tees from $20/pc, hoodies from $34/pc, joggers from $29/pc. 100 piece minimums.',
  },
};

export default function StreetWearPage() {
  return (
    <>
      <StreetWearHero />
      <ProductGrid />
      <HowItWorks />
      <DecorationMethods />
      <StreetWearForm />
      <PackagesCTA />
      <FloatingInquiryBar />
    </>
  );
}
