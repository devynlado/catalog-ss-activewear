import { Hero } from '@/components/home/Hero';
import { WhoWeService } from '@/components/home/WhoWeService';
import { TurnaroundBanner } from '@/components/home/TurnaroundBanner';
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
      
      {/* 3. Who We Service - Audience: We work with people like you */}
      <WhoWeService />
      
      {/* 3. How It Works - Reassurance: It's easy */}
      <HowItWorks />
      
      {/* 4. Categories - Action: Step 1, start here */}
      <CategoryGrid />
      
      {/* 5. Featured Products - Help: Not sure? Try these */}
      <FeaturedProducts />
      
      {/* 6. Services - Context: Here's what we'll do */}
      <ServicesGrid />
      
      {/* 7. Built for Scale - Credibility: We can handle it */}
      <BuiltForScale />
      
      {/* 8. Trust Signals - Proof: Others trust us */}
      <TrustSignals />
      
      {/* 9. Final CTA - Close: Let's do this */}
      <FinalCTA />
    </div>
  );
}
