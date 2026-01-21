import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getProductById } from '@/lib/ss-activewear';
import { ProductDetailClient } from './ProductDetailClient';
import { RelatedProducts } from '@/components/builder/RelatedProducts';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductPageProps {
  params: {
    productId: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const styleId = parseInt(params.productId, 10);
  if (isNaN(styleId)) return { title: 'Product Not Found' };

  const product = await getProductById(styleId);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.styleName} - ${product.brandName} | Garment Decor`,
    description: product.description || `Shop ${product.styleName} by ${product.brandName}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const styleId = parseInt(params.productId, 10);
  
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/catalog" className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
              <ChevronLeft className="h-4 w-4" />
              Back to Catalog
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">{product.brandName}</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-900">{product.styleName}</span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailClient product={product} />
        </Suspense>
      </div>

      {/* Related Products Section */}
      <div className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Show related by category first, or by brand if no category */}
          {product.categories && product.categories.length > 0 ? (
            <RelatedProducts
              categoryId={product.categories[0].id}
              currentProductId={product.id}
              title="Similar Products"
              maxProducts={8}
            />
          ) : (
            <RelatedProducts
              brandId={product.brandId}
              currentProductId={product.id}
              title={`More from ${product.brandName}`}
              maxProducts={8}
            />
          )}
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
