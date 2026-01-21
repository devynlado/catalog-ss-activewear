'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Loader2 } from 'lucide-react';

interface CacheStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
}

interface ProductGridProps {
  columns?: number;
  categoryFilter?: string;
  brandFilter?: string;
  colorFamilyFilter?: string;
  attributeFilter?: string; // Comma-separated attribute category IDs
  showPricing?: boolean;
  pageSize?: number;
  searchQuery?: string;
  initialProducts?: Product[];
  showPagination?: boolean;
}

export function ProductGrid({
  columns = 4,
  categoryFilter,
  brandFilter,
  colorFamilyFilter,
  attributeFilter,
  showPricing = true,
  pageSize = 48,
  searchQuery,
  initialProducts,
  showPagination = true,
}: ProductGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [isLoading, setIsLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({ status: 'idle', progress: 0 });

  // Track when cache becomes ready to trigger refresh
  const [cacheJustReady, setCacheJustReady] = useState(false);

  // Poll cache status while loading
  useEffect(() => {
    let wasLoading = false;
    
    const checkCacheStatus = async () => {
      try {
        const res = await fetch('/api/cache-status');
        const data = await res.json();
        
        // If cache just became ready, trigger a refresh
        if (data.status === 'ready' && wasLoading) {
          setCacheJustReady(true);
        }
        
        wasLoading = data.status === 'loading';
        setCacheStatus(data);
      } catch {
        // Ignore errors
      }
    };
    
    // Check immediately
    checkCacheStatus();
    
    // Poll every 3 seconds while not ready
    const interval = setInterval(() => {
      checkCacheStatus();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // If we have initial products, don't fetch
    if (initialProducts) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (categoryFilter) params.set('category', categoryFilter);
        if (brandFilter) params.set('brand', brandFilter);
        if (colorFamilyFilter) params.set('colorFamily', colorFamilyFilter);
        if (attributeFilter) params.set('attr', attributeFilter);
        params.set('page', currentPage.toString());
        params.set('pageSize', pageSize.toString());

        const response = await fetch(`/api/products?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.data || []);
        setTotalProducts(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    
    // Reset the flag after fetching
    if (cacheJustReady) {
      setCacheJustReady(false);
    }
  }, [categoryFilter, brandFilter, colorFamilyFilter, attributeFilter, searchQuery, pageSize, initialProducts, currentPage, cacheJustReady]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/catalog?${params.toString()}`);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
  };

  if (isLoading) {
    return <ProductGridSkeleton count={pageSize > 12 ? 12 : pageSize} />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 p-12 text-center">
        <p className="text-lg font-medium text-slate-600">No products found</p>
        <p className="mt-2 text-sm text-slate-500">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Cache loading indicator */}
      {cacheStatus.status === 'loading' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading product details ({cacheStatus.progress}%)... Pricing and colors will appear shortly.</span>
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
        </p>
      </div>

      {/* Product Grid */}
      <div className={`grid gap-6 ${gridCols[columns as keyof typeof gridCols] || gridCols[4]}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showPricing={showPricing}
            preferredColorFamily={colorFamilyFilter}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}

// Default export for Builder.io
export default ProductGrid;
