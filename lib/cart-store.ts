import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './database.types';

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  justAdded: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  clearJustAdded: () => void;
  
  // Computed
  getItemCount: () => number;
  getUniqueItemCount: () => number;
  getSubtotal: () => number;
  getTotalUnits: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      justAdded: false,
      
      addItem: (item) => {
        const newItem: CartItem = {
          ...item,
          id: `${item.sku}-${Date.now()}`,
        };
        
        // Check if same SKU already exists
        const existingIndex = get().items.findIndex(
          (i) => i.sku === item.sku
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
      
      clearCart: () => {
        set({ items: [] });
      },
      
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      clearJustAdded: () => set({ justAdded: false }),
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getUniqueItemCount: () => {
        return get().items.length;
      },
      
      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.discountedPrice ?? item.unitPrice) * item.quantity,
          0
        );
      },
      
      getTotalUnits: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'garment-decor-cart',
      partialize: (state) => ({ 
        items: state.items,
      }),
    }
  )
);

// Volume discount thresholds (for UI hints)
export const VOLUME_THRESHOLDS = [
  { min: 48, discount: 5, label: '5% off' },
  { min: 144, discount: 10, label: '10% off' },
  { min: 288, discount: 15, label: '15% off' },
];

export function getNextVolumeThreshold(currentUnits: number) {
  for (const threshold of VOLUME_THRESHOLDS) {
    if (currentUnits < threshold.min) {
      return {
        unitsNeeded: threshold.min - currentUnits,
        threshold: threshold.min,
        discount: threshold.discount,
        label: threshold.label,
      };
    }
  }
  return null; // Already at highest tier
}
