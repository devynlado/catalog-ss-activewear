'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Palette,
  MapPin,
  ClipboardList,
  Star,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TShirtDiagram } from '@/components/ui/TShirtDiagram';
import { 
  PrintLocation, 
  getScreenPrintEstimate,
  formatPriceRange,
  formatTotalRange,
  setupFees,
  locationLabels
} from '@/lib/pricing-utils';
import { useQuoteStore } from '@/lib/quote-store';

interface ScreenPrintConfiguratorProps {
  totalPieces: number;
  onComplete: () => void;
  onBack: () => void;
}

type Step = 'colors' | 'locations' | 'review';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'colors', label: 'Colors', icon: <Palette className="h-4 w-4" /> },
  { id: 'locations', label: 'Locations', icon: <MapPin className="h-4 w-4" /> },
  { id: 'review', label: 'Review', icon: <ClipboardList className="h-4 w-4" /> },
];

const COLOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const POPULAR_COLOR = 2;

export function ScreenPrintConfigurator({
  totalPieces,
  onComplete,
  onBack,
}: ScreenPrintConfiguratorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('colors');
  const [colors, setColors] = useState(2);
  const [locations, setLocations] = useState<PrintLocation[]>(['front']);
  
  const { setDecorationDetails } = useQuoteStore();

  // Calculate live pricing
  const estimate = useMemo(() => {
    if (totalPieces < 50) return null;
    return getScreenPrintEstimate(totalPieces, colors, locations.length || 1);
  }, [totalPieces, colors, locations.length]);

  const setupFee = colors * (locations.length || 1) * setupFees.screenPrint;

  const handleToggleLocation = (location: PrintLocation) => {
    setLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const handleNext = () => {
    if (currentStep === 'colors') {
      setCurrentStep('locations');
    } else if (currentStep === 'locations') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'locations') {
      setCurrentStep('colors');
    } else if (currentStep === 'review') {
      setCurrentStep('locations');
    } else {
      onBack();
    }
  };

  const handleConfirm = () => {
    // Save to quote store
    setDecorationDetails({
      type: 'screen',
      colors,
      locations,
    });
    onComplete();
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canProceed = currentStep === 'colors' || (currentStep === 'locations' && locations.length > 0);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                isActive && 'bg-brand-100 text-brand-700',
                isComplete && 'bg-green-100 text-green-700',
                !isActive && !isComplete && 'text-slate-400'
              )}>
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                  isActive && 'bg-brand-500 text-white',
                  isComplete && 'bg-green-500 text-white',
                  !isActive && !isComplete && 'bg-stone-200 text-stone-500'
                )}>
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 sm:w-16 h-0.5 mx-2',
                  index < currentStepIndex ? 'bg-green-400' : 'bg-stone-200'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Color Count */}
        {currentStep === 'colors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                How many colors in your design?
              </h3>
              <p className="text-slate-600">
                Each color requires a separate screen. More colors = more setup cost but richer designs.
              </p>
            </div>

            {/* Color selector grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {COLOR_OPTIONS.map((num) => {
                const isSelected = colors === num;
                const isPopular = num === POPULAR_COLOR;
                
                return (
                  <button
                    key={num}
                    onClick={() => setColors(num)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all font-semibold text-lg',
                      isSelected
                        ? 'bg-brand-50 border-brand-400 text-brand-700 shadow-md shadow-brand-500/10'
                        : 'bg-white border-stone-200 text-slate-700 hover:border-stone-300 hover:shadow-sm'
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-2 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[9px] font-bold rounded-full">
                        <Star className="h-2.5 w-2.5 fill-current" />
                      </span>
                    )}
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Pricing impact */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-slate-700">
                    <strong>{colors} color{colors !== 1 ? 's' : ''}</strong> = ${setupFees.screenPrint * colors * (locations.length || 1)} setup fee per location
                  </p>
                  {estimate && (
                    <p className="text-sm text-slate-600">
                      Estimated: <span className="font-semibold text-brand-600">{formatPriceRange(estimate)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Popular recommendation */}
            {colors === POPULAR_COLOR && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <Star className="h-4 w-4 inline mr-1 text-amber-500 fill-amber-500" />
                  <strong>Great choice!</strong> 2 colors is the most popular option — perfect for logos with primary + accent color.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Print Locations */}
        {currentStep === 'locations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Where do you want your design?
              </h3>
              <p className="text-slate-600">
                Select one or more print locations. Each location adds to the setup cost.
              </p>
            </div>

            {/* T-Shirt Diagram */}
            <TShirtDiagram
              selectedLocations={locations}
              onToggleLocation={handleToggleLocation}
            />

            {/* Selected summary */}
            {locations.length > 0 && (
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                <p className="text-sm font-medium text-brand-800 mb-2">
                  Selected locations ({locations.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <span
                      key={loc}
                      className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-medium"
                    >
                      {locationLabels[loc]}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-brand-600">
                  Setup fee: ${setupFee} ({colors} colors × {locations.length} location{locations.length !== 1 ? 's' : ''} × ${setupFees.screenPrint})
                </p>
              </div>
            )}

            {locations.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Please select at least one print location to continue.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Review Your Configuration
              </h3>
              <p className="text-slate-600">
                Here's a summary of your screen print setup. Confirm to continue.
              </p>
            </div>

            {/* Summary Card */}
            <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Quantity */}
                <div className="flex justify-between items-center pb-4 border-b border-brand-100">
                  <span className="text-slate-600">Total Pieces</span>
                  <span className="font-semibold text-slate-900">{totalPieces.toLocaleString()}</span>
                </div>

                {/* Colors */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ink Colors</span>
                  <span className="font-semibold text-slate-900">{colors} color{colors !== 1 ? 's' : ''}</span>
                </div>

                {/* Locations */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600">Print Locations</span>
                  <div className="text-right">
                    {locations.map((loc, idx) => (
                      <span key={loc} className="font-semibold text-slate-900">
                        {locationLabels[loc]}{idx < locations.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Setup Fee */}
                <div className="flex justify-between items-center pt-4 border-t border-brand-100">
                  <span className="text-slate-600">Setup Fee</span>
                  <span className="font-semibold text-slate-900">${setupFee}</span>
                </div>

                {/* Per Piece */}
                {estimate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Est. Per Piece</span>
                    <span className="font-semibold text-brand-600">{formatPriceRange(estimate)}</span>
                  </div>
                )}

                {/* Total */}
                {estimate && (
                  <div className="flex justify-between items-center pt-4 border-t border-brand-100">
                    <span className="font-medium text-slate-700">Estimated Total</span>
                    <span className="text-xl font-bold text-brand-600">{formatTotalRange(estimate)}</span>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="px-5 py-3 bg-brand-100/50 border-t border-brand-200">
                <p className="text-xs text-brand-700 flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  This is an estimate. Final pricing will be confirmed after artwork review.
                </p>
              </div>
            </div>

            {/* What's Next */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <h4 className="font-medium text-slate-900 mb-2">What happens next?</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Upload your artwork or describe your design
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Our team reviews and sends you a final quote
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Approve the proof, and we'll start production
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep !== 'review' ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            className="gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700"
          >
            <Check className="h-4 w-4" />
            Confirm & Continue
          </Button>
        )}
      </div>
    </div>
  );
}
