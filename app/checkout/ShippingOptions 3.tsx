'use client';

import { useState, useEffect } from 'react';
import { Truck, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShippingMethod = 'same_day' | 'economy';

interface ShippingOptionsProps {
  selected: ShippingMethod;
  onSelect: (method: ShippingMethod) => void;
  subtotal: number;
}

// Check if current time is before 12 PM PST cutoff
function isBeforeCutoff(): boolean {
  const now = new Date();
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const hour = pstTime.getHours();
  const day = pstTime.getDay();
  
  // Must be weekday (Mon-Fri) and before 12 PM
  const isWeekday = day >= 1 && day <= 5;
  return isWeekday && hour < 12;
}

// Get time remaining until cutoff
function getTimeUntilCutoff(): { hours: number; minutes: number } | null {
  if (!isBeforeCutoff()) return null;
  
  const now = new Date();
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const cutoff = new Date(pstTime);
  cutoff.setHours(12, 0, 0, 0);
  
  const diff = cutoff.getTime() - pstTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
}

// Calculate estimated delivery dates
function getDeliveryEstimate(method: ShippingMethod): { min: Date; max: Date } {
  const now = new Date();
  const canShipToday = isBeforeCutoff();
  
  // Helper to add business days
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    return result;
  };
  
  if (method === 'same_day' && canShipToday) {
    return {
      min: addBusinessDays(now, 1),
      max: addBusinessDays(now, 2),
    };
  } else if (method === 'same_day') {
    // Ships next business day
    return {
      min: addBusinessDays(now, 2),
      max: addBusinessDays(now, 3),
    };
  }
  
  // Economy
  return {
    min: addBusinessDays(now, 3),
    max: addBusinessDays(now, 5),
  };
}

function formatDateRange(min: Date, max: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const minStr = min.toLocaleDateString('en-US', options);
  const maxStr = max.toLocaleDateString('en-US', options);
  return `${minStr} - ${maxStr}`;
}

export function ShippingOptions({ selected, onSelect, subtotal }: ShippingOptionsProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilCutoff());
  const [canShipToday, setCanShipToday] = useState(isBeforeCutoff());
  
  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilCutoff());
      setCanShipToday(isBeforeCutoff());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const freeEconomyThreshold = 500;
  const economyPrice = subtotal >= freeEconomyThreshold ? 0 : 15;
  const sameDayPrice = 25;
  
  const sameDayEstimate = getDeliveryEstimate('same_day');
  const economyEstimate = getDeliveryEstimate('economy');
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900">Shipping Method</h3>
      
      {/* Same Day Dispatch */}
      <button
        type="button"
        onClick={() => onSelect('same_day')}
        className={cn(
          'w-full rounded-lg border-2 p-4 text-left transition-all',
          selected === 'same_day'
            ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
            : 'border-stone-200 bg-white hover:border-stone-300'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              selected === 'same_day' ? 'bg-brand-100' : 'bg-stone-100'
            )}>
              <Zap className={cn(
                'h-5 w-5',
                selected === 'same_day' ? 'text-brand-600' : 'text-slate-500'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Same Day Dispatch</span>
                {canShipToday && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    Ships Today!
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Est. delivery: <span className="font-medium text-slate-700">{formatDateRange(sameDayEstimate.min, sameDayEstimate.max)}</span>
              </p>
              {canShipToday && timeRemaining && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  Order within {timeRemaining.hours}h {timeRemaining.minutes}m for same-day dispatch
                </p>
              )}
            </div>
          </div>
          <span className="font-bold text-slate-900">${sameDayPrice}</span>
        </div>
      </button>
      
      {/* Economy Shipping */}
      <button
        type="button"
        onClick={() => onSelect('economy')}
        className={cn(
          'w-full rounded-lg border-2 p-4 text-left transition-all',
          selected === 'economy'
            ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
            : 'border-stone-200 bg-white hover:border-stone-300'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              selected === 'economy' ? 'bg-brand-100' : 'bg-stone-100'
            )}>
              <Truck className={cn(
                'h-5 w-5',
                selected === 'economy' ? 'text-brand-600' : 'text-slate-500'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Economy Shipping</span>
                {economyPrice === 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    FREE
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Est. delivery: <span className="font-medium text-slate-700">{formatDateRange(economyEstimate.min, economyEstimate.max)}</span>
              </p>
              {economyPrice > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Free shipping on orders over ${freeEconomyThreshold}
                </p>
              )}
            </div>
          </div>
          <span className={cn(
            'font-bold',
            economyPrice === 0 ? 'text-green-600' : 'text-slate-900'
          )}>
            {economyPrice === 0 ? 'Free' : `$${economyPrice}`}
          </span>
        </div>
      </button>
    </div>
  );
}

export { getDeliveryEstimate, formatDateRange, isBeforeCutoff };
