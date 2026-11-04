import { createPageMetadata } from '@/lib/metadata';
import { Hero } from '@/components/home-v2/Hero';
import { WhoWeService } from '@/components/home-v2/WhoWeService';
import { TurnaroundBanner } from '@/components/home-v2/TurnaroundBanner';
import { HowItWorks } from '@/components/home-v2/HowItWorks';
import { CategoryGrid } from '@/components/home-v2/CategoryGrid';
import { FeaturedProducts } from '@/components/home-v2/FeaturedProducts';
import { ServicesGrid } from '@/components/home-v2/ServicesGrid';
import { BuiltForScale } from '@/components/home-v2/BuiltForScale';
import { TrustSignals } from '@/components/home-v2/TrustSignals';
import { FinalCTA } from '@/components/home-v2/FinalCTA';

// NOTE: This is an internal SANDBOX copy of the homepage (/) used to experiment
// with new layout and design ideas without touching the live homepage.
// It renders a parallel set of components from `components/home-v2/*`, so any
// change you make here or in those components will NOT affect the live `/` page.
// `noIndex` keeps it out of Google. Delete this route + `components/home-v2/`
// once the redesign is approved (or promote it to `/` by swapping imports).
export const metadata = createPageMetadata({
  title: 'Homepage Preview (Internal) | Garment Decor',
  description: 'Internal sandbox for experimenting with a new homepage layout and design. Not for public use.',
  path: '/home-preview',
  noIndex: true,
});

export default function HomePreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Sandbox indicator — remove before promoting to production */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:text-sm">
        <span>🧪 PREVIEW SANDBOX</span>
        <span className="hidden sm:inline font-normal">
          — Experimental homepage. Changes here do not affect the live site.
        </span>
      </div>

      {/* 1. Hero - Hook: Who we are */}
      <Hero />

      {/* 2. Turnaround Banner - Urgency: We're fast */}
      <TurnaroundBanner />

      {/* 4. Services - Our bread & butter: Here's what we do */}
      <ServicesGrid />

      {/* 5. Who We Service - Audience: We work with people like you */}
      <WhoWeService />

      {/* Built for Scale - Credibility: We can handle it (moved up: after "Who We Work With") */}
      <BuiltForScale />

      {/* 6. How It Works - Reassurance: It's easy */}
      <HowItWorks />

      {/* 7. Categories - Action: Browse products */}
      <CategoryGrid />

      {/* 8. Featured Products - Help: Not sure? Try these */}
      <FeaturedProducts />

      {/* 10. Trust Signals - Proof: Others trust us */}
      <TrustSignals />

      {/* 11. Final CTA - Close: Let's do this */}
      <FinalCTA />
    </div>
  );
}
