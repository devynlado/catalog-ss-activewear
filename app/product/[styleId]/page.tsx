import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/ss-activewear';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductBreadcrumbs } from '@/components/catalog/ProductBreadcrumbs';
import { CompanionProducts } from '@/components/builder/CompanionProducts';
import { RelatedProducts } from '@/components/builder/RelatedProducts';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductPageProps {
  params: {
    styleId: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const styleId = parseInt(params.styleId, 10);
  if (isNaN(styleId)) return { title: 'Product Not Found' };

  const product = await getProductById(styleId);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.title || product.styleName} - ${product.brandName} | Garment Decor`,
    description: product.description || `Shop ${product.styleName} by ${product.brandName}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const styleId = parseInt(params.styleId, 10);
  
  if (isNaN(styleId)) {
    notFound();
  }

  const product = await getProductById(styleId);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:py-4 sm:px-6 lg:px-8">
          <ProductBreadcrumbs
            brandName={product.brandName}
            brandId={product.brandId}
            styleName={product.styleName}
            categories={product.categories}
          />
        </div>
      </div>

      {/* Product Content */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailClient product={product} />
        </Suspense>
      </div>

      {/* Companion Products (Complete the Look) */}
      <div className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CompanionProducts styleId={product.styleId} />
        </div>
      </div>

      {/* Similar Products Section (using comparableGroup) */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <RelatedProducts
            styleId={product.styleId}
            brandId={product.brandId}
            currentProductId={product.id}
            title="Similar Products"
            maxProducts={8}
          />
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
