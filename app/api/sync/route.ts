import { NextRequest, NextResponse } from 'next/server';
import { 
  syncPopularProducts, 
  syncInventoryOnly, 
  syncFullCatalog,
  syncCategoriesOnly,
  getLatestSyncStatus,
  getActiveProductCount,
} from '@/lib/product-sync';

/**
 * Product Sync API
 * 
 * POST /api/sync?type=popular|inventory|full|categories
 * POST /api/sync?type=full&resume=<logId>  (resume interrupted sync)
 * Protected with API key for security
 * 
 * GET /api/sync
 * Returns latest sync status
 */

// Verify API key for sync operations
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.SYNC_API_KEY;
  
  if (!expectedKey) {
    console.error('[Sync API] SYNC_API_KEY not configured');
    return false;
  }
  
  return apiKey === expectedKey;
}

export async function GET() {
  try {
    const status = await getLatestSyncStatus();
    
    return NextResponse.json({
      success: true,
      lastSync: status.lastSync,
      inventorySync: status.inventorySync,
      fullSync: status.fullSync,
    });
  } catch (error) {
    console.error('[Sync API] Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verify API key
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing API key' },
      { status: 401 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const syncType = searchParams.get('type') || 'inventory';
  const resumeId = searchParams.get('resume');
  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');
  
  // Support GET /api/sync?type=inventory&count=true to get total product count
  if (searchParams.get('count') === 'true') {
    const total = await getActiveProductCount();
    return NextResponse.json({ totalProducts: total });
  }
  
  if (resumeId) {
    console.log(`[Sync API] Resuming ${syncType} sync from log ID ${resumeId}...`);
  } else {
    console.log(`[Sync API] Starting ${syncType} sync...`);
  }
  
  try {
    let result;
    let logId: number | undefined;
    
    switch (syncType) {
      case 'popular':
        result = await syncPopularProducts();
        break;
      case 'full':
        const fullResult = await syncFullCatalog(resumeId ? parseInt(resumeId, 10) : undefined);
        result = fullResult;
        logId = fullResult.logId;
        break;
      case 'categories':
        result = await syncCategoriesOnly();
        break;
      case 'inventory':
      default:
        if (offsetParam !== null && limitParam !== null) {
          result = await syncInventoryOnly(parseInt(offsetParam, 10), parseInt(limitParam, 10));
        } else {
          result = await syncInventoryOnly();
        }
        break;
    }
    
    // Build response with optional logId for resume capability
    const responseStats: Record<string, unknown> = {
      productsProcessed: result.productsProcessed,
      colorsProcessed: result.colorsProcessed,
      skusProcessed: result.skusProcessed,
      duration: `${Math.round(result.duration / 1000)}s`,
    };
    
    if ('totalProducts' in result) {
      responseStats.totalProducts = result.totalProducts;
    }
    
    // Include logId for full sync so user can resume if needed
    if (logId !== undefined) {
      responseStats.logId = logId;
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${syncType} sync completed successfully`,
        stats: responseStats,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `${syncType} sync completed with errors`,
        errors: result.errors,
        stats: responseStats,
      }, { status: 207 }); // 207 Multi-Status for partial success
    }
  } catch (error) {
    console.error(`[Sync API] ${syncType} sync failed:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Increase timeout for sync operations (Vercel Pro allows up to 60s)
export const maxDuration = 60;
