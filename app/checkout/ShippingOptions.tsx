'use client';

export type ShippingMethod = 'same_day' | 'economy';

// Decoration adds 7-10 business days for production
const DECORATION_DAYS = { min: 7, max: 10 };

// Get delivery date estimate based on shipping method
export function getDeliveryEstimate(method: ShippingMethod): { min: Date; max: Date } {
  const now = new Date();
  const min = new Date(now);
  const max = new Date(now);
  
  if (method === 'same_day') {
    // Express: 1-2 business days
    min.setDate(min.getDate() + 1);
    max.setDate(max.getDate() + 2);
  } else {
    // Economy: 3-5 business days
    min.setDate(min.getDate() + 3);
    max.setDate(max.getDate() + 5);
  }
  
  return { min, max };
}

// Get delivery estimate that accounts for decoration time
export function getDecoratedDeliveryEstimate(method: ShippingMethod): { min: Date; max: Date } {
  const baseEstimate = getDeliveryEstimate(method);
  
  // Add decoration production time
  baseEstimate.min.setDate(baseEstimate.min.getDate() + DECORATION_DAYS.min);
  baseEstimate.max.setDate(baseEstimate.max.getDate() + DECORATION_DAYS.max);
  
  return baseEstimate;
}

// Get just the decoration timeline (for display purposes)
export function getDecorationTimeline(): { min: Date; max: Date } {
  const now = new Date();
  const min = new Date(now);
  const max = new Date(now);
  
  min.setDate(min.getDate() + DECORATION_DAYS.min);
  max.setDate(max.getDate() + DECORATION_DAYS.max);
  
  return { min, max };
}

// Format date range for display
export function formatDateRange(min: Date, max: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const minStr = min.toLocaleDateString('en-US', options);
  const maxStr = max.toLocaleDateString('en-US', options);
  
  return `${minStr} - ${maxStr}`;
}

// Check if current time is before same-day shipping cutoff (2pm PST)
export function isBeforeCutoff(): boolean {
  const now = new Date();
  // Convert to PST
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const hour = pstTime.getHours();
  const day = pstTime.getDay();
  
  // Only Mon-Fri, before 2pm PST
  const isWeekday = day >= 1 && day <= 5;
  const beforeCutoff = hour < 14;
  
  return isWeekday && beforeCutoff;
}
