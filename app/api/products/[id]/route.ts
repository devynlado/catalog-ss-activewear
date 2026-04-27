import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getInventoryMatrix } from '@/lib/ss-activewear';
import { getProductByStyleId, getCacheStats } from '@/lib/product-cache';

/**
 * Product Detail API - Hybrid Approach
 * 
 * 1. Try Supabase cache first (fast: ~100ms) - includes cached inventory
 * 2. Optionally fetch real-time inventory from SS API (accurate but slower)
 * 3. Fall back to SS API if cache miss
 * 
 * Query params:
 * - liveInventory=true: Fetch real-time inventory from SS API
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const styleId = parseInt(params.id, 10);
    const { searchParams } = new URL(request.url);
    const liveInventory = searchParams.get('liveInventory') === 'true';
    
    if (isNaN(styleId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // ========================================================================
    // TRY SUPABASE CACHE FIRST (fast path)
    // ========================================================================
    try {
      const stats = await getCacheStats();
      
      if (stats.totalProducts > 0) {
        console.log(`[Product Detail] Using Supabase cache for style ${styleId}`);
        
        const cachedProduct = await getProductByStyleId(styleId);
        
        if (cachedProduct) {
          // If live inventory requested, merge real-time qty from SS API
          if (liveInventory) {
            try {
              console.log(`[Product Detail] Fetching live inventory for style ${styleId}`);
              const liveInventoryMatrix = await getInventoryMatrix(styleId);
              
              // Merge live inventory into cached product
              // liveInventoryMatrix is Map<colorCode, Map<sizeName, qty>>
              if (liveInventoryMatrix && liveInventoryMatrix.size > 0) {
                // Update quantities in cached product
                for (const color of cachedProduct.colors) {
                  const colorInventory = liveInventoryMatrix.get(color.colorCode);
                  if (colorInventory) {
                    for (const size of color.sizes) {
                      const liveQty = colorInventory.get(size.name);
                      if (liveQty !== undefined) {
                        size.qty = liveQty;
                      }
                    }
                  }
                }
              }
            } catch (invError) {
              console.warn(`[Product Detail] Live inventory fetch failed, using cached qty:`, invError);
              // Continue with cached inventory - still better than failing
            }
          }
          
          return NextResponse.json(cachedProduct);
        }
      }
    } catch (cacheError) {
      console.warn('[Product Detail] Cache lookup failed:', cacheError);
      // Fall through to SS API
    }

    // ========================================================================
    // FALLBACK: SS ACTIVEWEAR API (slow path)
    // ========================================================================
    console.log(`[Product Detail] Cache miss, using SS API for style ${styleId}`);
    
    const product = await getProductById(styleId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
