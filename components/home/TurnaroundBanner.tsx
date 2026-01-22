'use client';

import { ShieldCheck, Zap, Clock, Calendar, Phone } from 'lucide-react';

// Calculate business days from today
function addBusinessDays(days: number): Date {
  const date = new Date();
  let added = 0;
  
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return date;
}

// Format date as "Wed, Jan 23"
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function TurnaroundBanner() {
  const rushDate = addBusinessDays(2);
  const standardDate = addBusinessDays(7);

  return (
    <section className="bg-navy-800 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          
          {/* Guarantee Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                Guaranteed
              </p>
              <p className="text-lg font-bold text-white">
                Expedited Service
              </p>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            
            {/* Rush Delivery */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-brand-400">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Rush Order</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">
                {formatDate(rushDate)}
              </p>
              <a 
                href="tel:+18559427636" 
                className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-400 transition-colors"
              >
                <Phone className="h-3 w-3" />
                Call for rush
              </a>
            </div>

            {/* Divider */}
            <div className="hidden h-12 w-px bg-white/20 lg:block" />

            {/* Standard Delivery */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Standard</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">
                {formatDate(standardDate)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Most orders
              </p>
            </div>

            {/* Divider */}
            <div className="hidden h-12 w-px bg-white/20 lg:block" />

            {/* Custom Deadline */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Have a Deadline?</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-white">
                We'll guarantee it
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tell us your event date
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
