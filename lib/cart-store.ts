import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './database.types';
import { DecorationSelection } from './decoration-pricing';

export interface AppliedCoupon {
  code: string;
  couponId: string;
  discountAmount: number;
  freeShipping: boolean;
}

interface CartStore {
  items: CartItem[];
  decoration: DecorationSelection | null;
  appliedCoupon: AppliedCoupon | null;
  isDrawerOpen: boolean;
  isDecorationModalOpen: boolean;
  justAdded: boolean;
  hasHydrated: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>, options?: { openDrawer?: boolean }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  clearJustAdded: () => void;
  setHasHydrated: (hydrated: boolean) => void;

  // Coupon
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  clearCoupon: () => void;

  // Decoration actions
  setDecoration: (decoration: DecorationSelection | null) => void;
  clearDecoration: () => void;
  openDecorationModal: () => void;
  closeDecorationModal: () => void;

  // Computed
  getItemCount: () => number;
  getUniqueItemCount: () => number;
  getSubtotal: () => number;
  getTotalUnits: () => number;
  getDecorationTotal: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      decoration: null,
      appliedCoupon: null,
      isDrawerOpen: false,
      isDecorationModalOpen: false,
      justAdded: false,
      hasHydrated: false,

      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      clearCoupon: () => set({ appliedCoupon: null }),

      addItem: (item, options = {}) => {
        const { openDrawer = true } = options;
        
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
          set({ 
            items, 
            isDrawerOpen: openDrawer ? true : get().isDrawerOpen, 
            justAdded: openDrawer 
          });
        } else {
          // Add new item
          set((state) => ({ 
            items: [...state.items, newItem],
            isDrawerOpen: openDrawer ? true : state.isDrawerOpen,
            justAdded: openDrawer,
          }));
        }
        
        // Clear justAdded after animation (only if we triggered it)
        if (openDrawer) {
          setTimeout(() => {
            set({ justAdded: false });
          }, 1000);
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
      
      clearCart: () => {
        set({ items: [], decoration: null, appliedCoupon: null });
      },
      
      setDecoration: (decoration) => {
        set({ decoration });
      },
      
      clearDecoration: () => {
        set({ decoration: null });
      },
      
      openDecorationModal: () => set({ isDecorationModalOpen: true }),
      closeDecorationModal: () => set({ isDecorationModalOpen: false }),
      
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      clearJustAdded: () => set({ justAdded: false }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      
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
      
      getDecorationTotal: () => {
        const decoration = get().decoration;
        return decoration ? decoration.totalPrice : 0;
      },
      
      getGrandTotal: () => {
        return get().getSubtotal() + get().getDecorationTotal();
      },
    }),
    {
      name: 'garment-decor-cart',
      partialize: (state) => ({
        items: state.items,
        decoration: state.decoration,
        appliedCoupon: state.appliedCoupon,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

