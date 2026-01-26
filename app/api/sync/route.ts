import { NextRequest, NextResponse } from 'next/server';
import { 
  syncPopularProducts, 
  syncInventoryOnly, 
  syncFullCatalog,
  getLatestSyncStatus 
} from '@/lib/product-sync';

/**
 * Product Sync API
 * 
 * POST /api/sync?type=popular|inventory|full
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
  
  console.log(`[Sync API] Starting ${syncType} sync...`);
  
  try {
    let result;
    
    switch (syncType) {
      case 'popular':
        result = await syncPopularProducts();
        break;
      case 'full':
        result = await syncFullCatalog();
        break;
      case 'inventory':
      default:
        result = await syncInventoryOnly();
        break;
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${syncType} sync completed successfully`,
        stats: {
          productsProcessed: result.productsProcessed,
          colorsProcessed: result.colorsProcessed,
          skusProcessed: result.skusProcessed,
          duration: `${Math.round(result.duration / 1000)}s`,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `${syncType} sync completed with errors`,
        errors: result.errors,
        stats: {
          productsProcessed: result.productsProcessed,
          colorsProcessed: result.colorsProcessed,
          skusProcessed: result.skusProcessed,
          duration: `${Math.round(result.duration / 1000)}s`,
        },
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
