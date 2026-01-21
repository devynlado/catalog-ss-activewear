import { Suspense } from 'react';
import { FilterSidebar } from '@/components/builder/FilterSidebar';
import { ProductGrid } from '@/components/builder/ProductGrid';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { MAIN_CATEGORIES } from '@/lib/category-taxonomy';

interface CatalogPageProps {
  searchParams: {
    search?: string;
    category?: string;
    brand?: string;
    colorFamily?: string;
    attr?: string; // Attribute category IDs (comma-separated)
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

// Default to T-Shirts category (ID: 21) for better UX with swatches
const DEFAULT_CATEGORY = '21';

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  const { search, brand, colorFamily, attr } = searchParams;
  
  // Use provided category, or default to T-Shirts if no filters applied
  const hasAnyFilter = searchParams.search || searchParams.category || searchParams.brand || searchParams.colorFamily || searchParams.attr;
  const category = searchParams.category || (hasAnyFilter ? undefined : DEFAULT_CATEGORY);
  
  // Get category name for display
  const categoryId = category ? parseInt(category, 10) : null;
  const categoryInfo = categoryId ? MAIN_CATEGORIES[categoryId] : null;
  const pageTitle = categoryInfo ? categoryInfo.name : 'Product Catalog';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-2 text-slate-600">
            {categoryInfo 
              ? `Browse our selection of ${categoryInfo.name.toLowerCase()}`
              : 'Browse our complete selection of blank apparel'
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterSidebar
                showBrands={true}
                showCategories={true}
                showPriceRange={true}
                collapsible={true}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Active Filters Summary */}
            <ActiveFilters search={search} category={category} brand={brand} colorFamily={colorFamily} attr={attr} />

            {/* Mobile Filters Toggle */}
            <div className="mb-6 lg:hidden">
              <details className="rounded-lg bg-white shadow-sm">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-900">
                  Filters & Sort
                </summary>
                <div className="border-t border-slate-100 p-4">
                  <FilterSidebar
                    showBrands={true}
                    showCategories={true}
                    showPriceRange={true}
                    collapsible={false}
                  />
                </div>
              </details>
            </div>

            {/* Products with Pagination */}
            <Suspense fallback={<ProductGridSkeleton count={20} />}>
              <ProductGrid
                columns={3}
                searchQuery={search}
                categoryFilter={category}
                brandFilter={brand}
                colorFamilyFilter={colorFamily}
                attributeFilter={attr}
                showPricing={true}
                pageSize={20}
                showPagination={true}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
