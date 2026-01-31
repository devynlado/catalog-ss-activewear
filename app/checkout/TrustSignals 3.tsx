'use client';

import { Lock, Truck, RotateCcw, Shield, Clock, BadgeDollarSign } from 'lucide-react';
import { isBeforeCutoff } from './ShippingOptions';
import { useState, useEffect } from 'react';

export function TrustSignals() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200/80 p-3 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50">
          <Lock className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Secure Checkout</p>
          <p className="text-[10px] text-slate-500">256-bit SSL encryption</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200/80 p-3 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
          <BadgeDollarSign className="h-4 w-4 text-brand-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Price Guarantee</p>
          <p className="text-[10px] text-slate-500">Lowest wholesale prices</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200/80 p-3 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
          <Truck className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Fast Shipping</p>
          <p className="text-[10px] text-slate-500">Same-day dispatch available</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200/80 p-3 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-50">
          <RotateCcw className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Easy Returns</p>
          <p className="text-[10px] text-slate-500">30-day return policy</p>
        </div>
      </div>
    </div>
  );
}

export function CutoffBanner() {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number } | null>(null);
  const [canShipToday, setCanShipToday] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const beforeCutoff = isBeforeCutoff();
      setCanShipToday(beforeCutoff);
      
      if (beforeCutoff) {
        const now = new Date();
        const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const cutoff = new Date(pstTime);
        cutoff.setHours(12, 0, 0, 0);
        
        const diff = cutoff.getTime() - pstTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining({ hours, minutes });
      } else {
        setTimeRemaining(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!canShipToday || !timeRemaining) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-3 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 animate-pulse">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-900">
          Order within{' '}
          <span className="font-bold text-amber-700">
            {timeRemaining.hours}h {timeRemaining.minutes}m
          </span>{' '}
          for same-day dispatch!
        </p>
      </div>
    </div>
  );
}

export function GuaranteeBadges() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg bg-green-50/50 border border-green-100 p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
          <Shield className="h-3.5 w-3.5 text-green-600" />
        </div>
        <span className="text-xs text-slate-700">
          <span className="font-semibold text-slate-800">Lowest Price Guarantee</span> - We match any competitor
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-green-50/50 border border-green-100 p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
          <RotateCcw className="h-3.5 w-3.5 text-green-600" />
        </div>
        <span className="text-xs text-slate-700">
          <span className="font-semibold text-slate-800">30-Day Returns</span> - Hassle-free returns policy
        </span>
      </div>
    </div>
  );
}
