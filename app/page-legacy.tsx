import { HeroLegacy as Hero } from '@/components/home/HeroLegacy';
import { WhoWeServiceLegacy as WhoWeService } from '@/components/home/WhoWeServiceLegacy';
import { TurnaroundBannerLegacy as TurnaroundBanner } from '@/components/home/TurnaroundBannerLegacy';
import { HowItWorksLegacy as HowItWorks } from '@/components/home/HowItWorksLegacy';
import { CategoryGridLegacy as CategoryGrid } from '@/components/home/CategoryGridLegacy';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ProductGuidesPromoLegacy as ProductGuidesPromo } from '@/components/home/ProductGuidesPromoLegacy';
import { ServicesGridLegacy as ServicesGrid } from '@/components/home/ServicesGridLegacy';
import { BuiltForScaleLegacy as BuiltForScale } from '@/components/home/BuiltForScaleLegacy';
import { TrustSignalsLegacy as TrustSignals } from '@/components/home/TrustSignalsLegacy';
import { FinalCTALegacy as FinalCTA } from '@/components/home/FinalCTALegacy';

/**
 * LEGACY HOMEPAGE
 * 
 * To revert to the old design:
 * 1. Rename this file to page.tsx
 * 2. Rename current page.tsx to page-softcraft.tsx
 * 
 * Or import Legacy components directly in the main page.tsx
 */

export default function HomePageLegacy() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero - Hook: Who we are */}
      <Hero />
      
      {/* 2. Turnaround Banner - Urgency: We're fast */}
      <TurnaroundBanner />
      
      {/* 3. Who We Service - Audience: We work with people like you */}
      <WhoWeService />
      
      {/* 3. How It Works - Reassurance: It's easy */}
      <HowItWorks />
      
      {/* 4. Categories - Action: Step 1, start here */}
      <CategoryGrid />
      
      {/* 5. Featured Products - Help: Not sure? Try these */}
      <FeaturedProducts />
      
      {/* 6. Product Guides - Discovery: Browse curated collections */}
      <ProductGuidesPromo />
      
      {/* 7. Services - Context: Here's what we'll do */}
      <ServicesGrid />
      
      {/* 8. Built for Scale - Credibility: We can handle it */}
      <BuiltForScale />
      
      {/* 9. Trust Signals - Proof: Others trust us */}
      <TrustSignals />
      
      {/* 10. Final CTA - Close: Let's do this */}
      <FinalCTA />
    </div>
  );
}
