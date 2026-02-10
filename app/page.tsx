import { Hero } from '@/components/home/Hero';
import { WhoWeService } from '@/components/home/WhoWeService';
import { TurnaroundBanner } from '@/components/home/TurnaroundBanner';
import { PackageDeals } from '@/components/home/PackageDeals';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { BuiltForScale } from '@/components/home/BuiltForScale';
import { TrustSignals } from '@/components/home/TrustSignals';
import { FinalCTA } from '@/components/home/FinalCTA';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero - Hook: Who we are */}
      <Hero />
      
      {/* 2. Turnaround Banner - Urgency: We're fast */}
      <TurnaroundBanner />
      
      {/* 3. Package Deals - Instant pricing path */}
      <PackageDeals />
      
      {/* 4. Services - Our bread & butter: Here's what we do */}
      <ServicesGrid />
      
      {/* 5. Who We Service - Audience: We work with people like you */}
      <WhoWeService />
      
      {/* 6. How It Works - Reassurance: It's easy */}
      <HowItWorks />
      
      {/* 7. Categories - Action: Browse products */}
      <CategoryGrid />
      
      {/* 8. Featured Products - Help: Not sure? Try these */}
      <FeaturedProducts />
      
      {/* 9. Built for Scale - Credibility: We can handle it */}
      <BuiltForScale />
      
      {/* 10. Trust Signals - Proof: Others trust us */}
      <TrustSignals />
      
      {/* 11. Final CTA - Close: Let's do this */}
      <FinalCTA />
    </div>
  );
}
