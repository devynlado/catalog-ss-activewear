import { create } from 'zustand';
import type { TierQty } from './streetwear-config';

export interface InquiryProduct {
  productId: string;
  title: string;
  category: string;
  image: string;
  preferredQty: TierQty;
}

interface StreetWearInquiryState {
  selectedProducts: InquiryProduct[];
  addProduct: (product: Omit<InquiryProduct, 'preferredQty'>) => void;
  removeProduct: (productId: string) => void;
  updateQty: (productId: string, qty: TierQty) => void;
  isSelected: (productId: string) => boolean;
  clearAll: () => void;
}

export const useStreetWearInquiry = create<StreetWearInquiryState>(
  (set, get) => ({
    selectedProducts: [],

    addProduct: (product) =>
      set((state) => ({
        selectedProducts: [
          ...state.selectedProducts,
          { ...product, preferredQty: 100 as TierQty },
        ],
      })),

    removeProduct: (productId) =>
      set((state) => ({
        selectedProducts: state.selectedProducts.filter(
          (p) => p.productId !== productId
        ),
      })),

    updateQty: (productId, qty) =>
      set((state) => ({
        selectedProducts: state.selectedProducts.map((p) =>
          p.productId === productId ? { ...p, preferredQty: qty } : p
        ),
      })),

    isSelected: (productId) =>
      get().selectedProducts.some((p) => p.productId === productId),

    clearAll: () => set({ selectedProducts: [] }),
  })
);
