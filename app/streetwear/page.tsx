import { createPageMetadata } from '@/lib/metadata';
import { StreetWearHero } from './_components/StreetWearHero';
import { ProductGrid } from './_components/ProductGrid';
import { FloatingInquiryBar } from './_components/FloatingInquiryBar';
import { HowItWorks } from './_components/HowItWorks';
import { DecorationMethods } from './_components/DecorationMethods';
import { StreetWearForm } from './_components/StreetWearForm';
import { PackagesCTA } from './_components/PackagesCTA';

export const metadata = createPageMetadata({
  title: 'Cut & Sew Sourcing With Garment Decor | Custom Manufacturing',
  description:
    'Source custom-manufactured streetwear — heavyweight tees, hoodies, joggers & more — with transparent per-unit pricing. 100pc minimums. Screen printing, embroidery, puff print, and rhinestone available.',
  path: '/streetwear',
});

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
