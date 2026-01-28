import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuoteItem } from './types';
import { DecorationType, StitchCount, PrintLocation } from './pricing-utils';

// Decoration configuration
export interface DecorationDetails {
  type: DecorationType;
  colors?: number;              // 1-8 for screen/jumbo
  locations?: PrintLocation[];  // Print/embroidery locations
  stitchCount?: StitchCount;    // For embroidery
}

interface QuoteStore {
  items: QuoteItem[];
  isDrawerOpen: boolean;
  justAdded: boolean; // For pulse animation
  
  // Decoration & Finishing
  decorationDetails: DecorationDetails;
  finishingServices: string[];
  designDescription: string;
  
  // Actions
  addItem: (item: Omit<QuoteItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearQuote: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  clearJustAdded: () => void;
  
  // Decoration actions
  setDecorationType: (type: DecorationType) => void;
  setDecorationDetails: (details: Partial<DecorationDetails>) => void;
  setFinishingServices: (services: string[]) => void;
  toggleFinishingService: (service: string) => void;
  setDesignDescription: (description: string) => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotalUnits: () => number;
}

const defaultDecorationDetails: DecorationDetails = {
  type: 'none',
  colors: 1,
  locations: [],
  stitchCount: '5k-7.5k',
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      justAdded: false,
      
      // Decoration & Finishing defaults
      decorationDetails: defaultDecorationDetails,
      finishingServices: [],
      designDescription: '',
      
      addItem: (item) => {
        const newItem: QuoteItem = {
          ...item,
          id: `${item.productId}-${item.colorCode}-${item.sizeName}-${Date.now()}`,
          addedAt: new Date(),
        };
        
        // Check if same product/color/size already exists
        const existingIndex = get().items.findIndex(
          (i) => 
            i.productId === item.productId && 
            i.colorCode === item.colorCode && 
            i.sizeName === item.sizeName
        );
        
        if (existingIndex >= 0) {
          // Update quantity of existing item
          const items = [...get().items];
          items[existingIndex].quantity += item.quantity;
          set({ items, isDrawerOpen: true, justAdded: true });
        } else {
          // Add new item
          set((state) => ({ 
            items: [...state.items, newItem],
            isDrawerOpen: true,
            justAdded: true,
          }));
        }
        
        // Clear justAdded after animation
        setTimeout(() => {
          set({ justAdded: false });
        }, 1000);
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearQuote: () => {
        set({ items: [] });
      },
      
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      clearJustAdded: () => set({ justAdded: false }),
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      },
      
      getTotalUnits: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      // Decoration actions
      setDecorationType: (type) => {
        set((state) => ({
          decorationDetails: {
            ...state.decorationDetails,
            type,
            // Reset type-specific fields when changing type
            colors: type === 'screen' || type === 'jumbo' ? 1 : undefined,
            locations: [],
            stitchCount: type === 'embroidery' ? '5k-7.5k' : undefined,
          },
        }));
      },
      
      setDecorationDetails: (details) => {
        set((state) => ({
          decorationDetails: {
            ...state.decorationDetails,
            ...details,
          },
        }));
      },
      
      setFinishingServices: (services) => {
        set({ finishingServices: services });
      },
      
      toggleFinishingService: (service) => {
        set((state) => ({
          finishingServices: state.finishingServices.includes(service)
            ? state.finishingServices.filter((s) => s !== service)
            : [...state.finishingServices, service],
        }));
      },
      
      setDesignDescription: (description) => {
        set({ designDescription: description });
      },
    }),
    {
      name: 'garment-decor-quote',
      partialize: (state) => ({ 
        items: state.items,
        decorationDetails: state.decorationDetails,
        finishingServices: state.finishingServices,
        designDescription: state.designDescription,
      }),
    }
  )
);
