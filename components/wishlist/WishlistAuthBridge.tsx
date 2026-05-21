'use client';

/**
 * Mounts globally (in LayoutWrapper). Bridges Supabase auth state into the
 * client wishlist store.
 *
 * Strategy: whenever we observe a signed-in user (whether already-signed-in
 * on page load OR a fresh SIGNED_IN transition), call mergeAndPullFromServer.
 * The merge endpoint is idempotent — it upserts (set-union) and returns the
 * canonical list. This means:
 *   - Returning logged-in user with empty local: merge([]) is a no-op, then
 *     pull gives them their existing server list.
 *   - User who signs up while having an anonymous local list: their local
 *     list is set-unioned into the server, nothing is lost.
 *   - Multiple tabs / repeated mounts: merging the same set of IDs again is
 *     harmless (ON CONFLICT DO NOTHING).
 *
 * On SIGNED_OUT we deliberately do NOT clear the local list — the user keeps
 * what they had, and anonymous-wishlist behaviour resumes transparently.
 *
 * Has no DOM output.
 */

import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useWishlistStore } from '@/lib/wishlist-store';

export function WishlistAuthBridge() {
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const mergeAndPullFromServer = useWishlistStore(
    (s) => s.mergeAndPullFromServer
  );

  // Guard against running the sync repeatedly while a user remains signed
  // in (the SDK can re-fire SIGNED_IN on token refresh, tab focus, etc.).
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for persisted localStorage to hydrate before merging — otherwise
    // we'd post an empty list and appear to "lose" the anonymous wishlist.
    if (!hasHydrated) return;

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (user && lastSyncedUserId.current !== user.id) {
        lastSyncedUserId.current = user.id;
        void mergeAndPullFromServer();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (lastSyncedUserId.current !== session.user.id) {
          lastSyncedUserId.current = session.user.id;
          void mergeAndPullFromServer();
        }
      } else if (event === 'SIGNED_OUT') {
        lastSyncedUserId.current = null;
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasHydrated, mergeAndPullFromServer]);

  return null;
}
