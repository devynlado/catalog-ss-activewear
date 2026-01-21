import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

/**
 * Get stock level class name
 */
export function getStockClass(qty: number): string {
  if (qty === 0) return 'stock-out';
  if (qty <= 11) return 'stock-low';
  return 'stock-high';
}

/**
 * Get stock level text
 */
export function getStockText(qty: number): string {
  if (qty === 0) return 'Out of stock';
  if (qty <= 11) return `Low stock (${qty})`;
  return `In stock (${qty})`;
}

/**
 * Parse search params from URL
 */
export function parseSearchParams(searchParams: URLSearchParams): {
  search: string;
  category: string | null;
  brand: string | null;
  page: number;
} {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category'),
    brand: searchParams.get('brand'),
    page: parseInt(searchParams.get('page') || '1', 10),
  };
}

/**
 * Build URL with search params
 */
export function buildUrl(base: string, params: Record<string, string | number | null | undefined>): string {
  const url = new URL(base, 'http://localhost');
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  
  return `${url.pathname}${url.search}`;
}
