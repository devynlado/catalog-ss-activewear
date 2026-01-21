import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/lib/ss-activewear';
import { Product } from '@/lib/types';

// Apply client-side filters (onSale, sustainable)
function applyProductFilters(products: Product[], filters: { onSale?: boolean; sustainable?: boolean }): Product[] {
  let filtered = products;
  
  if (filters.onSale) {
    filtered = filtered.filter(p => p.isOnSale);
  }
  
  if (filters.sustainable) {
    filtered = filtered.filter(p => p.isSustainable);
  }
  
  return filtered;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');
    const style = searchParams.get('style');
    const colorFamily = searchParams.get('colorFamily');
    const attr = searchParams.get('attr'); // Attribute category IDs
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    // Quick filters
    const onSale = searchParams.get('onSale') === 'true';
    const sustainable = searchParams.get('sustainable') === 'true';
    const hasQuickFilters = onSale || sustainable;

    let allProducts;

    if (search) {
      // Search by keyword or style number - limit to reasonable amount
      allProducts = await searchProducts(search);
      
      // Apply quick filters to search results
      if (hasQuickFilters) {
        allProducts = applyProductFilters(allProducts, { onSale, sustainable });
      }
      
      // Slice search results for pagination
      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }
    
    // Combine main category with attribute categories for filtering
    const allCategoryIds = [category, attr].filter(Boolean).join(',') || undefined;
    
    // When quick filters are active, we need to fetch more products and filter client-side
    // because the API doesn't support these filters directly
    const fetchLimit = hasQuickFilters ? pageSize * 5 : pageSize;
    const fetchOffset = hasQuickFilters ? 0 : (page - 1) * pageSize;
    
    allProducts = await getProducts({
      style: style || undefined,
      brand: brand || undefined,
      category: allCategoryIds,
      colorFamily: colorFamily || undefined,
      limit: fetchLimit,
      offset: fetchOffset,
    });

    // Apply quick filters
    if (hasQuickFilters) {
      allProducts = applyProductFilters(allProducts, { onSale, sustainable });
      
      // Paginate filtered results
      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
      });
    }

    // For pagination without quick filters, get total count from cached styles (fast)
    const { getFilteredStyleCount } = await import('@/lib/ss-activewear');
    const total = await getFilteredStyleCount({
      brand: brand || undefined,
      category: allCategoryIds,
    });
    
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: allProducts,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
