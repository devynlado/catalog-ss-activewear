import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ProductData {
  styleName?: string;
  brandName?: string;
  title?: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
}

interface RecentProduct {
  id: string;
  product_slug: string;
  product_data: ProductData;
  source: 'viewed' | 'quoted';
  viewed_at: string;
}

interface QuickReorderRowProps {
  products: RecentProduct[];
}

export function QuickReorderRow({ products }: QuickReorderRowProps) {
  if (products.length === 0) {
    return <EmptyReorderState />;
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy-800">Quick Reorder</h2>
          <p className="text-sm text-slate-500">Products you&apos;ve viewed or quoted</p>
        </div>
        <Link 
          href="/catalog"
          className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Browse Catalog
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative -mx-2">
        <div className="flex gap-4 overflow-x-auto px-2 pb-2 scrollbar-hide">
          {products.map((product) => (
            <QuickReorderCard key={product.id} product={product} />
          ))}
          
          {/* Browse More Card */}
          <Link
            href="/catalog"
            className="flex-shrink-0 flex w-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <Sparkles className="h-8 w-8 text-brand-400" />
            <span className="mt-2 text-sm font-medium text-slate-600">
              Browse More
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickReorderCard({ product }: { product: RecentProduct }) {
  const data = product.product_data;
  const displayName = data.title || data.styleName || 'Product';
  const hasPrice = data.price && data.price > 0;
  
  return (
    <Link
      href={`/product/${product.product_slug}`}
      className="group flex-shrink-0 w-36 rounded-xl border border-stone-200 bg-white overflow-hidden transition-all hover:shadow-md hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square bg-stone-100">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={displayName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-stone-300" />
          </div>
        )}
        
        {/* Source Badge */}
        {product.source === 'quoted' && (
          <div className="absolute left-2 top-2">
            <Badge variant="brand" className="text-xs px-1.5 py-0.5">
              Quoted
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {data.brandName || 'Brand'}
        </p>
        <h3 className="mt-0.5 text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-brand-600">
          {data.styleName || displayName}
        </h3>
        {hasPrice && (
          <p className="mt-1 text-sm font-bold text-slate-900">
            ${data.salePrice || data.price}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyReorderState() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy-800">Quick Reorder</h2>
          <p className="text-sm text-slate-500">Your recently viewed products will appear here</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6">
        <Sparkles className="h-10 w-10 text-brand-400" />
        <div>
          <p className="font-medium text-slate-700">Start browsing our catalog</p>
          <p className="text-sm text-slate-500">Products you view will appear here for easy reordering.</p>
        </div>
        <Link
          href="/catalog"
          className="ml-auto rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
