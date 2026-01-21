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
    const pageSize = parseInt(searchParams.get('pageSize') || '48', 10);

    let allProducts;

    if (search) {
      // Search by keyword or style number
      allProducts = await searchProducts(search);
    } else {
      // Combine main category with attribute categories for filtering
      const allCategoryIds = [category, attr].filter(Boolean).join(',') || undefined;
      
      allProducts = await getProducts({
        style: style || undefined,
        brand: brand || undefined,
        category: allCategoryIds,
        colorFamily: colorFamily || undefined,
        limit: 500, // Increased - caching makes this fast now
      });
    }

    // Calculate pagination
    const total = allProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedProducts,
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
