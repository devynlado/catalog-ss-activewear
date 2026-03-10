/**
 * Google Automated Discounts Store
 * 
 * Persists discount information for 48 hours to meet Google's requirements.
 * Uses both Zustand (runtime state) and cookies (persistence).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GoogleDiscount, isDiscountValid } from './google-discount';

// Cookie configuration
const DISCOUNT_COOKIE_NAME = 'gad_discounts';
const DISCOUNT_COOKIE_MAX_AGE = 48 * 60 * 60; // 48 hours in seconds

interface DiscountStore {
  // State
  discounts: Record<string, GoogleDiscount>;
  
  // Actions
  addDiscount: (discount: GoogleDiscount) => void;
  getDiscount: (offerId: string) => GoogleDiscount | null;
  getDiscountByStyleId: (styleId: number | string) => GoogleDiscount | null;
  getDiscountBySlug: (slug: string) => GoogleDiscount | null;
  removeDiscount: (offerId: string) => void;
  clearExpired: () => void;
  clearAll: () => void;
  
  // Hydration
  hydrateFromCookie: () => void;
  syncToCookie: () => void;
}

/**
 * Parse cookies from document.cookie string
 */
function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Set a cookie with proper attributes
 */
function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

/**
 * Zustand store for Google automated discounts
 */
export const useDiscountStore = create<DiscountStore>()(
  persist(
    (set, get) => ({
      discounts: {},
      
      addDiscount: (discount: GoogleDiscount) => {
        set((state) => {
          // Evict stale entries for the same product before adding the new one.
          // This prevents multiple discounts accumulating under different offerIds
          // (e.g., different SKUs of the same style) which causes find() to pick
          // the wrong one.
          const cleaned: Record<string, GoogleDiscount> = {};
          Object.entries(state.discounts).forEach(([id, existing]) => {
            const sameProduct =
              (discount.styleId && existing.styleId && existing.styleId === discount.styleId) ||
              (discount.productSlug && existing.productSlug && existing.productSlug === discount.productSlug);
            if (sameProduct && id !== discount.offerId) return; // evict
            cleaned[id] = existing;
          });
          return { discounts: { ...cleaned, [discount.offerId]: discount } };
        });
        get().syncToCookie();
      },
      
      getDiscount: (offerId: string) => {
        const discount = get().discounts[offerId];
        if (!discount) return null;
        
        // Check if discount is still valid
        if (!isDiscountValid(discount)) {
          get().removeDiscount(offerId);
          return null;
        }
        
        return discount;
      },
      
      getDiscountByStyleId: (styleId: number | string) => {
        const styleIdStr = String(styleId);
        const styleIdNum = typeof styleId === 'number' ? styleId : parseInt(styleId, 10);
        const discounts = Object.values(get().discounts);
        
        const discount = discounts.find((d) => {
          // Match on stored styleId (set when discount is persisted from a product page)
          if (d.styleId && !isNaN(styleIdNum) && d.styleId === styleIdNum) return true;
          // Fallback: exact offerId match
          if (d.offerId === styleIdStr) return true;
          // Fallback: offerId prefix match (legacy SKU format)
          if (d.offerId.startsWith(styleIdStr)) return true;
          // Also match on the stored styleId field (enriched on first landing)
          if (d.styleId !== undefined && String(d.styleId) === styleIdStr) return true;
          return false;
        });
        
        if (!discount) return null;
        
        // Check if discount is still valid
        if (!isDiscountValid(discount)) {
          get().removeDiscount(discount.offerId);
          return null;
        }
        
        return discount;
      },
      
      getDiscountBySlug: (slug: string) => {
        const discounts = Object.values(get().discounts);
        const discount = discounts.find((d) => d.productSlug === slug);
        
        if (!discount) return null;
        
        if (!isDiscountValid(discount)) {
          get().removeDiscount(discount.offerId);
          return null;
        }
        
        return discount;
      },
      
      removeDiscount: (offerId: string) => {
        set((state) => {
          const { [offerId]: removed, ...remaining } = state.discounts;
          return { discounts: remaining };
        });
        get().syncToCookie();
      },
      
      clearExpired: () => {
        set((state) => {
          const validDiscounts: Record<string, GoogleDiscount> = {};
          Object.entries(state.discounts).forEach(([id, discount]) => {
            if (isDiscountValid(discount)) {
              validDiscounts[id] = discount;
            }
          });
          return { discounts: validDiscounts };
        });
        get().syncToCookie();
      },
      
      clearAll: () => {
        set({ discounts: {} });
        deleteCookie(DISCOUNT_COOKIE_NAME);
      },
      
      hydrateFromCookie: () => {
        const cookies = parseCookies();
        const cookieValue = cookies[DISCOUNT_COOKIE_NAME];
        
        if (!cookieValue) return;
        
        try {
          const discounts = JSON.parse(cookieValue) as Record<string, GoogleDiscount>;
          // Filter out expired discounts
          const validDiscounts: Record<string, GoogleDiscount> = {};
          Object.entries(discounts).forEach(([id, discount]) => {
            if (isDiscountValid(discount)) {
              validDiscounts[id] = discount;
            }
          });
          
          if (Object.keys(validDiscounts).length > 0) {
            set({ discounts: validDiscounts });
          }
        } catch {
          // Invalid cookie data, clear it
          deleteCookie(DISCOUNT_COOKIE_NAME);
        }
      },
      
      syncToCookie: () => {
        const { discounts } = get();
        
        if (Object.keys(discounts).length === 0) {
          deleteCookie(DISCOUNT_COOKIE_NAME);
          return;
        }
        
        setCookie(
          DISCOUNT_COOKIE_NAME,
          JSON.stringify(discounts),
          DISCOUNT_COOKIE_MAX_AGE
        );
      },
    }),
    {
      name: 'google-discounts',
      storage: createJSONStorage(() => {
        // Use localStorage as backup, but primary is cookies
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydrating from localStorage, also check cookies
        state?.hydrateFromCookie();
        // Clean up expired discounts
        state?.clearExpired();
      },
    }
  )
);

/**
 * Hook to initialize discount store on client-side
 * Call this in your root layout or _app
 */
export function useInitializeDiscountStore(): void {
  // This will trigger hydration from localStorage and cookies
  // The persist middleware handles this automatically
}

/**
 * Get discount from store (for use outside React components)
 */
export function getDiscountFromStore(offerId: string): GoogleDiscount | null {
  return useDiscountStore.getState().getDiscount(offerId);
}

/**
 * Add discount to store (for use outside React components)
 */
export function addDiscountToStore(discount: GoogleDiscount): void {
  useDiscountStore.getState().addDiscount(discount);
}
