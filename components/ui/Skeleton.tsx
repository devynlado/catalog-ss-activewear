import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-200',
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-6 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function InventoryMatrixSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-8 w-24" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-16" />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Skeleton className="h-10 w-24" />
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="h-10 w-16" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
