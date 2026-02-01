'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { 
  Sparkles, 
  Lightbulb,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  Clock,
  Check,
  Star,
  Zap,
  Users,
  Maximize2,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Custom embroidery icon component
function EmbroideryIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L12 8" />
      <path d="M10 6L12 8L14 6" />
      <path d="M8 12C8 12 6 14 8 16C10 18 8 20 8 20" />
      <path d="M12 10C12 10 10 12 12 14C14 16 12 18 12 18" />
      <path d="M16 12C16 12 14 14 16 16C18 18 16 20 16 20" />
      <rect x="4" y="21" width="16" height="1" rx="0.5" />
    </svg>
  );
}

// Custom screen print icon
function ScreenPrintIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="3" rx="1" />
      <path d="M6 7L6 9" />
      <path d="M18 7L18 9" />
      <rect x="3" y="10" width="18" height="10" rx="1" />
      <path d="M7 14H17" />
      <path d="M7 17H17" />
    </svg>
  );
}

// Simplified tier packages
interface TierPackage {
  id: 'simple' | 'standard' | 'custom';
  name: string;
  tagline: string;
  description: string;
  specs: string[];
  priceFrom: string;
  setupFee: string;
  popular?: boolean;
  isCustom?: boolean;
}

const TIER_PACKAGES: TierPackage[] = [
  {
    id: 'simple',
    name: 'Simple Logo',
    tagline: 'Quick & Clean',
    description: 'Quick turnaround for clean, professional branding. Perfect for startups and simple designs.',
    specs: ['1-2 ink colors', '1 print location', '5-7 day turnaround'],
    priceFrom: '$2.00',
    setupFee: '$30',
  },
  {
    id: 'standard',
    name: 'Standard Branding',
    tagline: 'Full Coverage',
    description: 'Make a statement at your next event. Front and back coverage for maximum brand visibility.',
    specs: ['Up to 4 ink colors', 'Up to 2 locations', '5-7 day turnaround'],
    priceFrom: '$3.50',
    setupFee: '$60',
    popular: true,
  },
  {
    id: 'custom',
    name: 'Custom Project',
    tagline: 'Your Vision',
    description: 'Bring your vision to life with unlimited options. Our team will provide a custom quote.',
    specs: ['Unlimited colors', 'Any locations', 'Rush available'],
    priceFrom: 'Custom',
    setupFee: 'Quoted',
    isCustom: true,
  },
];

// Decoration methods for expert path
interface DecorationMethod {
  id: 'embroidery' | 'screen-print' | 'jumbo-print' | 'finishing';
  name: string;
  description: string;
  priceFrom: string;
  turnaround: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const DECORATION_METHODS: DecorationMethod[] = [
  {
    id: 'embroidery',
    name: 'Embroidery',
    description: 'Premium stitched logos',
    priceFrom: '$3.00',
    turnaround: '5-7 days',
    icon: <EmbroideryIcon className="h-6 w-6" />,
  },
  {
    id: 'screen-print',
    name: 'Screen Print',
    description: 'Classic ink prints',
    priceFrom: '$2.00',
    turnaround: '5-7 days',
    icon: <ScreenPrintIcon className="h-6 w-6" />,
    popular: true,
  },
  {
    id: 'jumbo-print',
    name: 'Jumbo Print',
    description: 'Oversized prints',
    priceFrom: '$4.00',
    turnaround: '7-10 days',
    icon: <Maximize2 className="h-6 w-6" />,
  },
  {
    id: 'finishing',
    name: 'Finishing',
    description: 'Tags & packaging',
    priceFrom: '$0.50',
    turnaround: '3-5 days',
    icon: <Tag className="h-6 w-6" />,
  },
];

type ModalView = 'paths' | 'tiers' | 'methods';

interface DecorationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  productStyleId: number;
  totalPieces: number;
  totalAmount: number;
}

export function DecorationMethodModal({
  isOpen,
  onClose,
  productStyleId,
  totalPieces,
  totalAmount,
}: DecorationMethodModalProps) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>('paths');

  // Reset view when modal closes
  const handleClose = () => {
    setView('paths');
    onClose();
  };

  const handleSelectTier = (tier: TierPackage) => {
    const params = new URLSearchParams({
      path: 'quick',
      tier: tier.id,
      styleId: productStyleId.toString(),
      pieces: totalPieces.toString(),
    });
    
    router.push(`/decorate?${params.toString()}`);
    handleClose();
  };

  const handleSelectMethod = (method: DecorationMethod) => {
    const params = new URLSearchParams({
      path: 'expert',
      method: method.id,
      styleId: productStyleId.toString(),
      pieces: totalPieces.toString(),
    });
    
    router.push(`/decorate?${params.toString()}`);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6 lg:p-8">
        {/* Path Selection View */}
        {view === 'paths' && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 mb-4">
                <Sparkles className="h-7 w-7 text-brand-600" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                How would you like to proceed?
              </h2>
              <p className="mt-2 text-slate-600">
                Decorating {totalPieces} piece{totalPieces !== 1 ? 's' : ''} — choose your path
              </p>
            </div>

            {/* Two Path Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {/* Help Me Choose Path */}
              <button
                onClick={() => setView('tiers')}
                className={cn(
                  'group relative text-left p-6 rounded-2xl border-2 transition-all duration-200',
                  'bg-gradient-to-br from-brand-50/50 to-white',
                  'border-brand-200 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
                )}
              >
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-brand-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    Help Me Choose
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 flex-1">
                    Quick packages for common projects. Perfect for most first-time orders.
                  </p>

                  {/* Features */}
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-xs text-slate-500">
                      <Zap className="h-3.5 w-3.5 text-brand-500" />
                      3 simple packages
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-brand-500" />
                      Fastest checkout
                    </li>
                  </ul>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                    Show Packages
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* I Know What I Want Path */}
              <button
                onClick={() => setView('methods')}
                className={cn(
                  'group relative text-left p-6 rounded-2xl border-2 transition-all duration-200',
                  'bg-white hover:bg-gradient-to-br hover:from-white hover:to-stone-50',
                  'border-stone-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
                )}
              >
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center mb-4 group-hover:from-brand-100 group-hover:to-brand-200 transition-colors">
                    <SlidersHorizontal className="h-6 w-6 text-slate-600 group-hover:text-brand-600 transition-colors" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    I Know What I Want
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 flex-1">
                    Full control over colors, locations, and methods. For decoration pros.
                  </p>

                  {/* Features */}
                  <ul className="mt-4 space-y-1.5">
                    <li className="flex items-center gap-2 text-xs text-slate-500">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                      Custom configuration
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-500">
                      <Check className="h-3.5 w-3.5 text-slate-400" />
                      All decoration types
                    </li>
                  </ul>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-brand-600">
                    Configure Now
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                4.9 from 500+ reviews
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                2,000+ businesses served
              </span>
            </div>
          </>
        )}

        {/* Simplified Tiers View */}
        {view === 'tiers' && (
          <>
            {/* Header with Back Button */}
            <div className="mb-6">
              <button
                onClick={() => setView('paths')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                Choose Your Package
              </h2>
              <p className="mt-1 text-slate-600">
                Select a package that fits your project
              </p>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TIER_PACKAGES.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier)}
                  className={cn(
                    'group relative text-left p-5 rounded-2xl border-2 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                    tier.popular
                      ? 'bg-gradient-to-br from-brand-50 to-white border-brand-300 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50'
                  )}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute -top-2.5 left-4 px-3 py-0.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-semibold rounded-full shadow-sm">
                      Most Popular
                    </div>
                  )}

                  {/* Tier Name & Tagline */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {tier.tagline}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {tier.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4">
                    {tier.description}
                  </p>

                  {/* Specs */}
                  <ul className="space-y-1.5 mb-4">
                    {tier.specs.map((spec, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {spec}
                      </li>
                    ))}
                  </ul>

                  {/* Pricing */}
                  <div className="pt-4 border-t border-stone-100">
                    {tier.isCustom ? (
                      <span className="text-lg font-bold text-brand-600">
                        Custom Quote
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-brand-600">
                          From {tier.priceFrom}
                        </span>
                        <span className="text-xs text-slate-500">/piece</span>
                      </div>
                    )}
                    {!tier.isCustom && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        + {tier.setupFee} setup
                      </p>
                    )}
                  </div>

                  {/* Select indicator */}
                  <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-50 group-hover:bg-brand-50 transition-colors">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-brand-600 transition-colors">
                      {tier.isCustom ? 'Get Quote' : 'Choose Package'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            {/* Help text */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Not sure? Our team can help you decide.{' '}
              <a href="tel:8088457836" className="text-brand-600 hover:text-brand-700 font-medium">
                Call (808) 845-7836
              </a>
            </p>
          </>
        )}

        {/* Expert Methods View */}
        {view === 'methods' && (
          <>
            {/* Header with Back Button */}
            <div className="mb-6">
              <button
                onClick={() => setView('paths')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                Select Decoration Method
              </h2>
              <p className="mt-1 text-slate-600">
                Choose a method to configure your order
              </p>
            </div>

            {/* Method Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DECORATION_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method)}
                  className={cn(
                    'group relative text-left p-4 rounded-xl border-2 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                    method.popular
                      ? 'bg-gradient-to-br from-brand-50 to-white border-brand-200 hover:border-brand-400'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  )}
                >
                  {/* Popular badge */}
                  {method.popular && (
                    <div className="absolute -top-2 right-2 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-semibold rounded-full">
                      Popular
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center mb-3 transition-colors',
                    method.popular
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-stone-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-600'
                  )}>
                    {method.icon}
                  </div>

                  {/* Name & Description */}
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {method.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {method.description}
                  </p>

                  {/* Price */}
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <span className="text-sm font-semibold text-brand-600">
                      From {method.priceFrom}
                    </span>
                    <span className="text-xs text-slate-400">/pc</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Info text */}
            <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-700">Pro tip:</strong> Screen printing is most cost-effective for large orders with 1-3 colors. 
                For photo-realistic or full-color designs, consider embroidery or ask about digital printing.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
