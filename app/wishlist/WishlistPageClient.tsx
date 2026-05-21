'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { useWishlistStore } from '@/lib/wishlist-store';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Product } from '@/lib/types';
import { formatPrice, cn } from '@/lib/utils';
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton';

interface WishlistApiResponse {
  products: Product[];
  orphans: number[];
}

/**
 * Proxy Google Drive URLs through our image proxy to bypass CORS.
 * Mirrors the helper used in ProductCard / ProductDetailClient.
 */
function proxyImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.usercontent.google.com') || url.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function WishlistPageClient() {
  const items = useWishlistStore((s) => s.items);
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const lastError = useWishlistStore((s) => s.lastError);
  const clearError = useWishlistStore((s) => s.clearError);

  // Server-side product details for the currently saved ids.
  const [products, setProducts] = useState<Product[]>([]);
  const [orphanIds, setOrphanIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Supabase Auth state — used to decide whether to show the soft sign-in
  // banner. The /orders email-OTP session is intentionally NOT checked here:
  // it's a separate session model, and a user who only verified via /orders
  // doesn't have a real "save across devices" account either.
  const [isSupabaseUser, setIsSupabaseUser] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSupabaseUser(Boolean(user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSupabaseUser(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch product details whenever the wishlist ids change. We re-key the
  // effect on `items.join` so adding/removing always triggers a refresh.
  // The endpoint is cheap (a single `.in` query) so this is fine.
  const itemsKey = useMemo(() => items.slice().sort((a, b) => a - b).join(','), [items]);

  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;

    if (items.length === 0) {
      setProducts([]);
      setOrphanIds([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);

    fetch('/api/wishlist/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: items }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load wishlist');
        return res.json() as Promise<WishlistApiResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        // Preserve the user's wishlist order (newest-first per the store).
        const productByStyleId = new Map<number, Product>();
        for (const p of data.products) productByStyleId.set(p.styleId, p);
        const ordered = items
          .map((id) => productByStyleId.get(id))
          .filter((p): p is Product => Boolean(p));
        setProducts(ordered);
        setOrphanIds(data.orphans);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load wishlist'
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // We intentionally depend on `itemsKey` not `items` so unrelated state
    // changes to the array reference don't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, hasHydrated]);

  const totalCount = items.length;

  // While the persisted store is still hydrating, show a placeholder rather
  // than a flash of empty-state.
  if (!hasHydrated) {
    return <PageShell><LoadingState /></PageShell>;
  }

  return (
    <PageShell>
      {/* Header row: title + count + back-to-orders link */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 hover:text-brand-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to My Orders
            </Link>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-navy-800 sm:text-3xl">
            <Heart className="h-7 w-7 fill-red-500 text-red-500" />
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount === 0
              ? 'Save products you love and come back to them later.'
              : `${totalCount} ${totalCount === 1 ? 'item' : 'items'} saved`}
          </p>
        </div>

        {totalCount > 0 && (
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-stone-300 hover:bg-stone-50 sm:self-end"
          >
            Continue shopping
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Soft sign-in banner — only for anonymous Supabase users with items. */}
      {isSupabaseUser === false && totalCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div className="flex-1">
            <p className="font-medium text-navy-800">
              Save your wishlist across devices
            </p>
            <p className="mt-0.5 text-slate-600">
              Your wishlist is currently saved on this browser only.{' '}
              <Link
                href="/signup"
                className="font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                Create an account
              </Link>{' '}
              or{' '}
              <Link
                href="/login"
                className="font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                sign in
              </Link>{' '}
              to keep it synced when you switch devices.
            </p>
          </div>
        </div>
      )}

      {/* Inline error banner — surfaced by the store on hard failures. */}
      {lastError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{lastError}</div>
          <button
            onClick={clearError}
            className="text-xs text-red-600 underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {fetchError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{fetchError}</div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : totalCount === 0 ? (
        <EmptyState />
      ) : (
        <WishlistGrid products={products} orphanIds={orphanIds} />
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center sm:p-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Heart className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-navy-800">
        Your wishlist is empty
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Tap the heart on any product to save it here. Your wishlist is
        private — only you can see it.
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        <ShoppingBag className="h-4 w-4" />
        Browse the catalog
      </Link>
    </div>
  );
}

function WishlistGrid({
  products,
  orphanIds,
}: {
  products: Product[];
  orphanIds: number[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <WishlistTile key={product.styleId} product={product} />
      ))}
      {orphanIds.map((id) => (
        <OrphanTile key={`orphan-${id}`} styleId={id} />
      ))}
    </div>
  );
}

function WishlistTile({ product }: { product: Product }) {
  const isUnavailable =
    product.isActive === false || product.manuallyHidden === true;

  const image = proxyImageUrl(
    product.colors[0]?.frontImage || product.imageUrl || ''
  );
  const displayPrice = product.salePrice ?? product.price;
  const hasPrice = displayPrice > 0;
  const productName =
    product.title && product.title !== product.styleName
      ? product.title
      : `${product.brandName} ${product.styleName}`;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-lg',
        isUnavailable && 'opacity-70'
      )}
    >
      {/* Heart button (remove from wishlist) — always interactive, even on
          unavailable products, so the user can clean up their list. */}
      <div className="absolute right-3 top-3 z-10">
        <WishlistHeartButton styleId={product.styleId} variant="page" />
      </div>

      {/* Unavailable tag, top-left to mirror the existing badge slot. */}
      {isUnavailable && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          No longer available
        </div>
      )}

      <Link
        href={isUnavailable ? '#' : `/product/${product.slug}`}
        onClick={(e) => {
          if (isUnavailable) e.preventDefault();
        }}
        className={cn(
          'block',
          isUnavailable && 'cursor-not-allowed'
        )}
      >
        <div className="relative aspect-[4/5] bg-stone-50">
          {image ? (
            <Image
              src={image}
              alt={productName}
              fill
              className={cn(
                'object-contain transition-transform duration-300',
                !isUnavailable && 'group-hover:scale-105',
                isUnavailable && 'grayscale'
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {product.brandName}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900">
            {productName}
          </h3>
          {hasPrice ? (
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {formatPrice(displayPrice)}
            </p>
          ) : (
            <p className="mt-1.5 text-xs font-medium text-brand-600">
              Request Quote
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

/**
 * A wishlist row whose product no longer exists in the catalog (purged from
 * the cache entirely — different from `manually_hidden`/`is_active=false`,
 * which we still render fully). Shown as a minimal greyed-out placeholder
 * with a remove button.
 */
function OrphanTile({ styleId }: { styleId: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 opacity-70">
      <div className="absolute right-3 top-3 z-10">
        <WishlistHeartButton styleId={styleId} variant="page" />
      </div>
      <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        No longer available
      </div>
      <div className="flex aspect-[4/5] items-center justify-center text-stone-300">
        <ShoppingBag className="h-12 w-12" />
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Product unavailable
        </p>
        <h3 className="mt-0.5 text-sm font-semibold text-slate-700">
          This product is no longer in our catalog.
        </h3>
        <p className="mt-1.5 text-xs text-slate-500">
          Tap the heart to remove it from your wishlist.
        </p>
      </div>
    </div>
  );
}
