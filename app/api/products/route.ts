import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/lib/ss-activewear';

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

    let allProducts;

    if (search) {
      // Search by keyword or style number - limit to reasonable amount
      allProducts = await searchProducts(search);
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
    
    // Only fetch exactly what we need for this page (pageSize products)
    // This dramatically speeds up category browsing
    allProducts = await getProducts({
      style: style || undefined,
      brand: brand || undefined,
      category: allCategoryIds,
      colorFamily: colorFamily || undefined,
      limit: pageSize, // Only fetch what we'll display
      offset: (page - 1) * pageSize, // Skip to current page
    });

    // For pagination, we need total count - get it from cached styles (fast)
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
