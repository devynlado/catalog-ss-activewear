import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './database.types';
import { DecorationSelection } from './decoration-pricing';
import { hasTieredPricing, getTieredPrice, getNextTierInfo, getEffectiveItemPrice } from './tiered-pricing';
import { getItemWarehouse, groupCartByWarehouse, isMultiWarehouseCart, type Warehouse, type ShipmentGroup } from './shipping';

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

  // Tiered pricing helpers
  getTieredUnitPrice: (item: CartItem) => number;
  getStyleQuantity: (styleId: number) => number;
  getTierUpsell: (styleId: number) => ReturnType<typeof getNextTierInfo>;

  // Warehouse helpers
  getShipmentGroups: () => ShipmentGroup[];
  isMultiWarehouse: () => boolean;
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
          warehouse: item.warehouse ?? getItemWarehouse(item.styleId),
        };
        
        // Check if same SKU already exists
        const existingIndex = get().items.findIndex(
          (i) => i.sku === item.sku
        );
        
        if (existingIndex >= 0) {
          // Update quantity of existing item
          const items = [...get().items];
          const existing = items[existingIndex];
          existing.quantity += item.quantity;
          if (item.googleDiscountPercent != null) {
            existing.googleDiscountPercent = item.googleDiscountPercent;
          }
          if (item.discountedPrice != null) {
            existing.discountedPrice = item.discountedPrice;
          }
          if (item.discountSource) {
            existing.discountSource = item.discountSource;
          }
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
        const items = get().items;
        const styleQtys = new Map<number, number>();
        for (const item of items) {
          if (hasTieredPricing(item.styleId)) {
            styleQtys.set(item.styleId, (styleQtys.get(item.styleId) || 0) + item.quantity);
          }
        }
        return items.reduce((sum, item) => {
          const totalStyleQty = styleQtys.get(item.styleId) ?? 0;
          return sum + getEffectiveItemPrice(item, totalStyleQty) * item.quantity;
        }, 0);
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

      getTieredUnitPrice: (item: CartItem) => {
        const totalQty = get().getStyleQuantity(item.styleId);
        return getEffectiveItemPrice(item, totalQty);
      },

      getStyleQuantity: (styleId: number) => {
        return get().items
          .filter((i) => i.styleId === styleId)
          .reduce((sum, i) => sum + i.quantity, 0);
      },

      getTierUpsell: (styleId: number) => {
        const totalQty = get().getStyleQuantity(styleId);
        return getNextTierInfo(styleId, totalQty);
      },

      getShipmentGroups: () => groupCartByWarehouse(get().items),
      isMultiWarehouse: () => isMultiWarehouseCart(get().items),
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
        const snapshot = state?.items;
        if (snapshot && snapshot.length > 0) {
          void fetch('/api/cart/refresh-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: snapshot }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { items?: CartItem[] } | null) => {
              if (data?.items && Array.isArray(data.items)) {
                useCartStore.setState({ items: data.items });
              }
            })
            .catch(() => {});
        }
      },
    }
  )
);

