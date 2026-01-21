import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuoteItem } from './types';

interface QuoteStore {
  items: QuoteItem[];
  isDrawerOpen: boolean;
  
  // Actions
  addItem: (item: Omit<QuoteItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearQuote: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      
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
          set({ items, isDrawerOpen: true });
        } else {
          // Add new item
          set((state) => ({ 
            items: [...state.items, newItem],
            isDrawerOpen: true,
          }));
        }
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
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      },
    }),
    {
      name: 'garment-decor-quote',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
