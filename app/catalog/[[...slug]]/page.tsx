import { Suspense } from 'react';
import { Metadata } from 'next';
import { FilterSidebar } from '@/components/builder/FilterSidebar';
import { ProductGrid } from '@/components/builder/ProductGrid';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { MobileFilters } from '@/components/catalog/MobileFilters';
import { resolveSlugPath, getRouteTitle, CATALOG_ROUTES } from '@/lib/catalog-routes';
import { getCategoryDisplayName } from '@/lib/category-taxonomy';

interface CatalogPageProps {
  params: {
    slug?: string[];
  };
  searchParams: {
    search?: string;
    category?: string;  // Legacy query param support
    brand?: string;
    colorFamily?: string;
    attr?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    // Quick filters
    featured?: string;
    onSale?: string;
    sustainable?: string;
    streetwear?: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const route = resolveSlugPath(params.slug || []);
  const title = route ? getRouteTitle(route) : 'All Products';
  
  return {
    title: `${title} | Garment Decor Catalog`,
    description: route 
      ? `Shop ${title.toLowerCase()} for custom screen printing and embroidery. Add to your quote today.`
      : 'Browse our full catalog of blank apparel for custom decoration. T-shirts, hoodies, headwear, bags and more.',
  };
}

// Generate static params for all known routes (optional - for static generation)
export async function generateStaticParams() {
  const paths: { slug: string[] }[] = [];
  
  for (const path of Object.keys(CATALOG_ROUTES)) {
    const slugs = path.split('/');
    paths.push({ slug: slugs });
  }
  
  return paths;
}

export default function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { search, brand, colorFamily, attr } = searchParams;
  
  // Quick filters (convert string to boolean)
  const featured = searchParams.featured === 'true';
  const onSale = searchParams.onSale === 'true';
  const sustainable = searchParams.sustainable === 'true';
  const streetwear = searchParams.streetwear === 'true';
  
  // Try to resolve the slug path to a route
  const route = resolveSlugPath(params.slug || []);
  
  // Get category filter - from slug route or legacy query param
  let categoryFilter: string | undefined;
  let pageTitle: string;
  
  if (route) {
    // Slug-based route: use category IDs from the route
    categoryFilter = route.categoryIds.join(',');
    pageTitle = getRouteTitle(route);
  } else if (searchParams.category) {
    // Legacy query param: use getCategoryDisplayName for title
    categoryFilter = searchParams.category;
    const categoryInfo = getCategoryDisplayName(searchParams.category);
    pageTitle = categoryInfo?.name || 'Products';
  } else {
    // No filter: show all products
    pageTitle = 'All Products';
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 sm:block">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{pageTitle}</h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 sm:hidden">
              50pc min
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 sm:mt-2 sm:text-base">
            {route || searchParams.category
              ? `Add ${pageTitle.toLowerCase()} to your quote`
              : 'Add to quote — pricing within 24hrs'
            }
          </p>
          <p className="mt-1 hidden text-sm text-brand-600 sm:block">
            Mix sizes, colors & styles across products — 50 piece minimum
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
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
            <ActiveFilters 
              search={search} 
              category={categoryFilter} 
              brand={brand} 
              colorFamily={colorFamily} 
              attr={attr} 
            />

            {/* Mobile Filters Toggle */}
            <MobileFilters />

            {/* Products with Pagination */}
            <Suspense fallback={<ProductGridSkeleton count={20} />}>
              <ProductGrid
                columns={3}
                searchQuery={search}
                categoryFilter={categoryFilter}
                brandFilter={brand}
                colorFamilyFilter={colorFamily}
                attributeFilter={attr}
                showPricing={true}
                pageSize={20}
                showPagination={true}
                // Quick filters
                featuredFilter={featured}
                onSaleFilter={onSale}
                sustainableFilter={sustainable}
                streetwearFilter={streetwear}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
