'use client';

import { Check, ShoppingBag, Palette, Send } from 'lucide-react';
import { useQuoteStore } from '@/lib/quote-store';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Select Products', icon: ShoppingBag },
  { id: 2, name: 'Add Details', icon: Palette },
  { id: 3, name: 'Get Quote', icon: Send },
];

interface QuoteProgressStepperProps {
  currentStep?: number; // 1, 2, or 3
  className?: string;
}

export function QuoteProgressStepper({ currentStep = 1, className }: QuoteProgressStepperProps) {
  const { items } = useQuoteStore();
  const hasItems = items.length > 0;
  
  // Auto-determine step based on context if not explicitly set
  // Step 1: No items yet
  // Step 2: Has items (reviewing/adding details)
  // Step 3: Submitting quote
  const activeStep = currentStep;

  return (
    <div className={cn("w-full", className)}>
      <nav aria-label="Quote progress">
        <ol className="flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.id < activeStep;
            const isCurrent = step.id === activeStep;
            const isUpcoming = step.id > activeStep;
            
            return (
              <li key={step.id} className="flex items-center">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && "bg-brand-500 text-white ring-2 ring-brand-200",
                      isUpcoming && "bg-stone-200 text-stone-500"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium hidden sm:inline",
                      isCurrent && "text-brand-700",
                      isCompleted && "text-green-600",
                      isUpcoming && "text-stone-400"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 sm:mx-3 h-0.5 w-6 sm:w-10",
                      step.id < activeStep ? "bg-green-500" : "bg-stone-200"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
