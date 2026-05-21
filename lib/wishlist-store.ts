/**
 * Client-side wishlist store. Mirrors the Zustand+persist pattern used by
 * `lib/cart-store.ts`.
 *
 * Storage strategy:
 *   - The Set of style_ids is always persisted to localStorage (key
 *     `garment-decor-wishlist`). This is the source of truth for anonymous
 *     users and the offline cache for logged-in users.
 *   - On login (handled by <WishlistAuthBridge />), the client POSTs the
 *     localStorage list to /api/wishlist/merge, then replaces the local list
 *     with the merged server response.
 *   - On logout, the store does NOT clear — we keep their selections so they
 *     don't lose their list if they sign out by accident. (The next user to
 *     sign in on this device will merge with whatever's here, which is
 *     standard e-commerce behaviour.)
 *
 * Why no React Context: the rest of the app (cart, etc.) uses bare Zustand
 * stores. Hooks read directly via `useWishlistStore()` — no provider
 * mounting required.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 200;

interface WishlistStore {
  // The wishlist is a Set semantically, but Zustand+persist serializes JSON,
  // so we store an array and expose Set-like APIs.
  items: number[];

  // Last sync state — `syncing` lets the UI show a spinner on the heart;
  // `error` is surfaced inline next to the action that triggered it.
  syncing: boolean;
  lastError: string | null;
  hasHydrated: boolean;

  // Read helpers
  has: (styleId: number) => boolean;
  count: () => number;

  // Mutations — these are optimistic. They update local state immediately
  // and fire-and-forget the server call; on failure they revert and set
  // `lastError`.
  add: (styleId: number) => Promise<void>;
  remove: (styleId: number) => Promise<void>;
  toggle: (styleId: number) => Promise<{ added: boolean }>;

  // Called by <WishlistAuthBridge /> on sign-in events.
  mergeAndPullFromServer: () => Promise<void>;

  clearError: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,
      lastError: null,
      hasHydrated: false,

      has: (styleId) => get().items.includes(styleId),
      count: () => get().items.length,

      add: async (styleId) => {
        if (!Number.isFinite(styleId) || styleId <= 0) return;
        const current = get().items;
        if (current.includes(styleId)) return;
        if (current.length >= MAX_ITEMS) {
          set({
            lastError: `Wishlist is full (max ${MAX_ITEMS} items)`,
          });
          return;
        }

        // Optimistic insert at the front (newest-first matches the server).
        set({
          items: [styleId, ...current],
          lastError: null,
        });

        // Fire-and-forget server sync. If the user is anonymous, the API
        // returns 401 — that's fine, localStorage already has the data.
        try {
          const res = await postJson('/api/wishlist', {
            productStyleId: styleId,
          });
          if (!res.ok && res.status !== 401) {
            // Revert — server rejected for a real reason (not just anon).
            set({
              items: get().items.filter((id) => id !== styleId),
              lastError: 'Could not save to your wishlist. Please try again.',
            });
          }
        } catch {
          // Network error — keep the optimistic state. The next page load
          // will reconcile when the user is online again.
        }
      },

      remove: async (styleId) => {
        const current = get().items;
        if (!current.includes(styleId)) return;

        const optimistic = current.filter((id) => id !== styleId);
        set({ items: optimistic, lastError: null });

        try {
          const res = await fetch(`/api/wishlist/${styleId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
          });
          if (!res.ok && res.status !== 401) {
            // Revert.
            set({
              items: current,
              lastError:
                'Could not remove from your wishlist. Please try again.',
            });
          }
        } catch {
          // Keep optimistic; reconcile later.
        }
      },

      toggle: async (styleId) => {
        if (get().items.includes(styleId)) {
          await get().remove(styleId);
          return { added: false };
        }
        await get().add(styleId);
        return { added: true };
      },

      mergeAndPullFromServer: async () => {
        set({ syncing: true, lastError: null });
        try {
          const local = get().items;
          const res = await postJson('/api/wishlist/merge', { items: local });
          if (res.ok) {
            const data = (await res.json()) as { items?: unknown };
            if (Array.isArray(data.items)) {
              const merged = data.items
                .map((n) => Number(n))
                .filter((n): n is number => Number.isFinite(n) && n > 0);
              set({ items: merged });
            }
          }
        } catch {
          // Silent — user can still use localStorage list.
        } finally {
          set({ syncing: false });
        }
      },

      clearError: () => set({ lastError: null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'garment-decor-wishlist',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
