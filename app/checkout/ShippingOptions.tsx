'use client';

export type ShippingMethod = 'same_day' | 'economy';

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
