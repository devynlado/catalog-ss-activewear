import type { Product } from '@/lib/types';
import { ProductBreadcrumbs } from '@/components/catalog/ProductBreadcrumbs';
import { RelatedProducts } from '@/components/builder/RelatedProducts';
import Link from 'next/link';

interface DiscontinuedProductPageProps {
  product: Product;
}

export function DiscontinuedProductPage({ product }: DiscontinuedProductPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50/50">
      {/* Breadcrumb */}
      <div className="relative bg-gradient-to-r from-white via-stone-50/30 to-white border-b border-stone-200">
        <div className="relative mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <ProductBreadcrumbs
            brandName={product.brandName}
            brandId={product.brandId}
            styleName={product.styleName}
            categories={product.categories}
          />
        </div>
      </div>

      {/* Discontinued Notice */}
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        {/* Product image (faded) */}
        {product.imageUrl && (
          <div className="mx-auto mb-8 w-48 h-48 relative opacity-40 grayscale">
            <img
              src={product.imageUrl}
              alt={product.title || product.styleName}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 mb-6">
          <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="text-sm font-medium text-amber-800">Product Discontinued</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
          {product.brandName} {product.styleName}
        </h1>
        <p className="text-lg text-stone-600 mb-4">
          {product.title || product.styleName}
        </p>

        <p className="text-stone-500 max-w-lg mx-auto mb-8">
          This product has been discontinued by the manufacturer and is no longer
          available for purchase. Check out similar products below that you might like.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Browse Catalog
          </Link>
          <Link
            href={`/catalog?brand=${product.brandId}`}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            More from {product.brandName}
          </Link>
        </div>
      </div>

      {/* Similar Products */}
      <div className="relative bg-gradient-to-b from-stone-50 to-stone-100/50 border-t border-stone-200 overflow-hidden">
        <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <RelatedProducts
            styleId={product.styleId}
            brandId={product.brandId}
            currentProductId={product.id}
            title="Similar Products You Might Like"
            maxProducts={8}
          />
        </div>
      </div>
    </div>
  );
}
