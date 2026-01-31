'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { PrintLocation, locationLabels } from '@/lib/pricing-utils';

interface TShirtDiagramProps {
  selectedLocations: PrintLocation[];
  onToggleLocation: (location: PrintLocation) => void;
  disabled?: boolean;
  className?: string;
}

// Clickable zones for each location
const LOCATION_ZONES: Record<PrintLocation, { x: number; y: number; width: number; height: number; label: string }> = {
  'front': { x: 85, y: 95, width: 70, height: 80, label: 'Front' },
  'back': { x: 85, y: 185, width: 70, height: 60, label: 'Back' },
  'left-sleeve': { x: 30, y: 85, width: 40, height: 50, label: 'L. Sleeve' },
  'right-sleeve': { x: 170, y: 85, width: 40, height: 50, label: 'R. Sleeve' },
};

export function TShirtDiagram({
  selectedLocations,
  onToggleLocation,
  disabled = false,
  className,
}: TShirtDiagramProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop: Interactive SVG Diagram */}
      <div className="hidden sm:block">
        <svg
          viewBox="0 0 240 280"
          className="w-full max-w-xs mx-auto"
          style={{ height: 'auto' }}
        >
          {/* T-Shirt Shape */}
          <path
            d="M120 20
               L80 20 L50 50 L30 80 L50 100 L70 90 L70 250 L170 250 L170 90 L190 100 L210 80 L190 50 L160 20 L120 20"
            fill="#f5f5f4"
            stroke="#d6d3d1"
            strokeWidth="2"
            className="transition-colors"
          />
          
          {/* Collar */}
          <ellipse
            cx="120"
            cy="30"
            rx="25"
            ry="12"
            fill="#fafaf9"
            stroke="#d6d3d1"
            strokeWidth="1.5"
          />

          {/* Clickable Location Zones */}
          {(Object.entries(LOCATION_ZONES) as [PrintLocation, typeof LOCATION_ZONES['front']][]).map(([location, zone]) => {
            const isSelected = selectedLocations.includes(location);
            return (
              <g key={location}>
                {/* Clickable area */}
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  rx={8}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    disabled && 'cursor-not-allowed opacity-50',
                    isSelected
                      ? 'fill-brand-100 stroke-brand-500'
                      : 'fill-stone-100/50 stroke-stone-300 hover:fill-brand-50 hover:stroke-brand-300'
                  )}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={isSelected ? 'none' : '4 2'}
                  onClick={() => !disabled && onToggleLocation(location)}
                />
                
                {/* Check icon when selected */}
                {isSelected && (
                  <g transform={`translate(${zone.x + zone.width / 2 - 8}, ${zone.y + zone.height / 2 - 8})`}>
                    <circle cx="8" cy="8" r="10" fill="#EE8935" />
                    <path
                      d="M5 8 L7 10 L11 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                )}
                
                {/* Label */}
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height + 12}
                  textAnchor="middle"
                  className={cn(
                    'text-[10px] font-medium pointer-events-none',
                    isSelected ? 'fill-brand-600' : 'fill-stone-500'
                  )}
                >
                  {zone.label}
                </text>
              </g>
            );
          })}
        </svg>
        
        <p className="text-center text-xs text-slate-500 mt-2">
          Click on the areas to select print locations
        </p>
      </div>

      {/* Mobile: Checkbox Fallback */}
      <div className="sm:hidden space-y-2">
        <p className="text-sm font-medium text-slate-700 mb-3">Select print locations:</p>
        {(Object.keys(LOCATION_ZONES) as PrintLocation[]).map((location) => {
          const isSelected = selectedLocations.includes(location);
          return (
            <button
              key={location}
              type="button"
              onClick={() => !disabled && onToggleLocation(location)}
              disabled={disabled}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                disabled && 'opacity-50 cursor-not-allowed',
                isSelected
                  ? 'bg-brand-50 border-brand-300 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              )}
            >
              <span className={cn(
                'font-medium',
                isSelected ? 'text-brand-700' : 'text-slate-700'
              )}>
                {locationLabels[location]}
              </span>
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-brand-500 text-white'
                  : 'bg-stone-100 border border-stone-300'
              )}>
                {isSelected && <Check className="h-4 w-4" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
