'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  Construction, 
  Check, 
  Clock, 
  Package,
  Zap,
  Star,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ScreenPrintConfigurator } from './ScreenPrintConfigurator';
import { ProductMockupPreview } from '@/components/builder/ProductMockupPreview';
import { QuoteSummary } from './QuoteSummary';
import { ArtworkUpload } from './ArtworkUpload';
import { QuoteConfirmation } from './QuoteConfirmation';
import { useQuoteStore } from '@/lib/quote-store';
import { getScreenPrintEstimate } from '@/lib/pricing-utils';

// Tier data for quick path
const TIER_DATA: Record<string, { name: string; tagline: string; specs: string[] }> = {
  'simple': {
    name: 'Simple Logo',
    tagline: 'Quick & Clean',
    specs: ['1-2 ink colors', '1 print location', '5-7 day turnaround'],
  },
  'standard': {
    name: 'Standard Branding', 
    tagline: 'Full Coverage',
    specs: ['Up to 4 ink colors', 'Up to 2 locations', '5-7 day turnaround'],
  },
  'custom': {
    name: 'Custom Project',
    tagline: 'Your Vision',
    specs: ['Unlimited colors', 'Any locations', 'Rush available'],
  },
};

// Method data for expert path
const METHOD_DATA: Record<string, { name: string; description: string }> = {
  'embroidery': { name: 'Embroidery', description: 'Premium stitched logos' },
  'screen-print': { name: 'Screen Print', description: 'Classic ink prints' },
  'jumbo-print': { name: 'Jumbo Print', description: 'Oversized prints' },
  'finishing': { name: 'Finishing Services', description: 'Tags & packaging' },
};

type FlowStep = 'configure' | 'artwork' | 'confirmation';

function DecorateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = searchParams.get('path'); // 'quick' or 'expert'
  const tier = searchParams.get('tier'); // 'simple', 'standard', 'custom'
  const method = searchParams.get('method'); // 'embroidery', 'screen-print', etc.
  const styleId = searchParams.get('styleId');
  const pieces = searchParams.get('pieces');

  const totalPieces = parseInt(pieces || '0', 10);
  
  const { decorationDetails } = useQuoteStore();

  // Flow step tracking
  const [flowStep, setFlowStep] = useState<FlowStep>('configure');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate estimated total for confirmation
  const estimatedTotal = useMemo(() => {
    if (decorationDetails.type === 'screen' && totalPieces >= 50) {
      const estimate = getScreenPrintEstimate(
        totalPieces,
        decorationDetails.colors || 2,
        decorationDetails.locations?.length || 1
      );
      return estimate ? Math.round((estimate.totalMin + estimate.totalMax) / 2) : 0;
    }
    return 0;
  }, [decorationDetails, totalPieces]);

  // Determine what to show based on path
  const isQuickPath = path === 'quick';
  const isExpertPath = path === 'expert';
  const isScreenPrint = method === 'screen-print';
  
  const tierInfo = tier ? TIER_DATA[tier] : null;
  const methodInfo = method ? METHOD_DATA[method] : null;

  // Page title based on selection
  let pageTitle = 'Decoration Configuration';
  let pageSubtitle = 'Configure your decoration options';
  
  if (isQuickPath && tierInfo) {
    pageTitle = tierInfo.name;
    pageSubtitle = tierInfo.tagline;
  } else if (isExpertPath && methodInfo) {
    pageTitle = `${methodInfo.name} Configuration`;
    pageSubtitle = methodInfo.description;
  }

  // Show full configurator for screen print expert path
  const showConfigurator = isExpertPath && isScreenPrint && totalPieces >= 50;

  const handleConfiguratorComplete = () => {
    setFlowStep('artwork');
  };

  const handleArtworkSubmit = async (files: File[], description: string) => {
    setIsSubmitting(true);
    
    // Simulate API call - in production, this would submit to your backend
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // TODO: Actually submit quote to backend
    // const response = await submitQuote({
    //   decorationDetails,
    //   files,
    //   description,
    //   totalPieces,
    //   styleId,
    // });
    
    setIsSubmitting(false);
    setFlowStep('confirmation');
  };

  const handleBack = () => {
    if (flowStep === 'artwork') {
      setFlowStep('configure');
    } else {
      router.back();
    }
  };

  // Step labels for progress indicator
  const steps = [
    { id: 'configure', label: 'Configure' },
    { id: 'artwork', label: 'Artwork' },
    { id: 'confirmation', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === flowStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50/50">
      {/* Grain texture */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative orbs */}
      <div className="pointer-events-none fixed -right-32 top-20 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none fixed -left-32 top-1/2 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Back link - hide on confirmation */}
        {flowStep !== 'confirmation' && (
          <Link 
            href={styleId ? `/product/${styleId}` : '/catalog'}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to product
          </Link>
        )}

        {/* Confirmation Screen */}
        {flowStep === 'confirmation' && (
          <div className="py-8">
            <QuoteConfirmation
              totalPieces={totalPieces}
              estimatedTotal={estimatedTotal}
            />
          </div>
        )}

        {/* Full Configurator Layout */}
        {showConfigurator && flowStep !== 'confirmation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-50 to-white border-b border-stone-200/50 px-6 lg:px-8 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                          {flowStep === 'artwork' ? 'Upload Artwork' : pageTitle}
                        </h1>
                        <p className="text-slate-600">
                          {flowStep === 'artwork' ? 'Add your logo or design' : pageSubtitle}
                        </p>
                      </div>
                    </div>
                    
                    {/* Pieces badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{totalPieces} pieces</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center gap-2">
                    {steps.slice(0, -1).map((step, index) => {
                      const isActive = step.id === flowStep;
                      const isComplete = index < currentStepIndex;
                      
                      return (
                        <div key={step.id} className="flex items-center">
                          <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            isActive && 'bg-brand-100 text-brand-700',
                            isComplete && 'bg-green-100 text-green-700',
                            !isActive && !isComplete && 'bg-stone-100 text-slate-500'
                          )}>
                            <div className={cn(
                              'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                              isActive && 'bg-brand-500 text-white',
                              isComplete && 'bg-green-500 text-white',
                              !isActive && !isComplete && 'bg-stone-300 text-stone-600'
                            )}>
                              {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                            </div>
                            <span className="hidden sm:inline">{step.label}</span>
                          </div>
                          
                          {index < steps.length - 2 && (
                            <div className={cn(
                              'w-8 h-0.5 mx-1',
                              index < currentStepIndex ? 'bg-green-400' : 'bg-stone-200'
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Configurator Content */}
                <div className="p-6 lg:p-8">
                  {flowStep === 'configure' && (
                    <ScreenPrintConfigurator
                      totalPieces={totalPieces}
                      onComplete={handleConfiguratorComplete}
                      onBack={handleBack}
                    />
                  )}
                  
                  {flowStep === 'artwork' && (
                    <ArtworkUpload
                      onSubmit={handleArtworkSubmit}
                      onBack={handleBack}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Preview */}
              <div className="lg:sticky lg:top-6 space-y-6">
                <ProductMockupPreview
                  productName="Selected Product" 
                  totalPieces={totalPieces}
                  colors={decorationDetails.colors || 2}
                  locations={decorationDetails.locations || ['front']}
                />
                
                {/* Quote Summary - show on artwork step */}
                {flowStep === 'artwork' && (
                  <QuoteSummary
                    totalPieces={totalPieces}
                    productName="Selected Garments"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon / Non-configurator Content */}
        {!showConfigurator && flowStep !== 'confirmation' && (
          <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-50 to-white border-b border-stone-200/50 px-6 lg:px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                        {pageTitle}
                      </h1>
                      <p className="text-slate-600">{pageSubtitle}</p>
                    </div>
                  </div>
                </div>
                
                {/* Pieces badge */}
                {pieces && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{pieces} pieces</span>
                  </div>
                )}
              </div>

              {/* Selection summary */}
              {(tierInfo || methodInfo) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {isQuickPath && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                      <Zap className="h-3 w-3" />
                      Quick Path
                    </span>
                  )}
                  {isExpertPath && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      Expert Path
                    </span>
                  )}
                  {tierInfo && tierInfo.specs.map((spec, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-stone-100 text-slate-600 text-xs"
                    >
                      <Check className="h-3 w-3 text-green-500" />
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Coming Soon Content */}
            <div className="p-6 lg:p-8">
              <div className="text-center py-8">
                {/* Construction Icon */}
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 mb-6">
                  <Construction className="h-8 w-8 text-amber-600" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {totalPieces < 50 && isExpertPath && isScreenPrint 
                    ? 'Minimum Order Required'
                    : 'Configuration Coming Soon'
                  }
                </h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  {totalPieces < 50 && isExpertPath && isScreenPrint
                    ? `Screen printing requires a minimum of 50 pieces. You currently have ${totalPieces} pieces selected.`
                    : "We're building an amazing configuration experience. In the meantime, our team can help you complete your order."
                  }
                </p>

                {/* What's coming */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">1</span>
                      Visual Configuration
                    </h3>
                    <p className="text-sm text-slate-600">
                      Interactive tools to select colors, locations, and see real-time pricing
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">2</span>
                      Live Mockups
                    </h3>
                    <p className="text-sm text-slate-600">
                      Preview your logo on the actual garment before ordering
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">3</span>
                      Artwork Upload
                    </h3>
                    <p className="text-sm text-slate-600">
                      Upload your logo and get instant feedback on print quality
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">4</span>
                      Instant Quotes
                    </h3>
                    <p className="text-sm text-slate-600">
                      Get detailed pricing breakdown with no surprises
                    </p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link 
                    href="/contact"
                    className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 h-12 rounded-lg px-6 text-base w-full sm:w-auto"
                  >
                    Contact Our Team
                  </Link>
                  <Link 
                    href="/quote"
                    className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-stone-200 bg-white text-slate-900 hover:bg-stone-50 focus:ring-brand-500 h-12 rounded-lg px-6 text-base w-full sm:w-auto"
                  >
                    Build a Quote Manually
                  </Link>
                </div>

                {/* Contact info */}
                <p className="mt-6 text-sm text-slate-500">
                  Or call us directly:{' '}
                  <a href="tel:8088457836" className="text-brand-600 hover:text-brand-700 font-medium">
                    (808) 845-7836
                  </a>
                </p>
              </div>
            </div>

            {/* Footer with trust signals */}
            <div className="border-t border-stone-200/50 bg-stone-50/50 px-6 lg:px-8 py-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500" />
                  Free artwork review
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Response in 2 hours
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  4.9 from 500+ reviews
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Social proof - hide on confirmation */}
        {flowStep !== 'confirmation' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Trusted by 2,000+ businesses including local teams, schools, and companies
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DecoratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    }>
      <DecorateContent />
    </Suspense>
  );
}
