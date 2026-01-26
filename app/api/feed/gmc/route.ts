import { NextRequest, NextResponse } from 'next/server';
import { POPULAR_PRODUCTS } from '@/lib/popular-products';
import { 
  generateFeedRow, 
  generateCSV, 
  GMCFeedRow,
  ProductVariant 
} from '@/lib/gmc-feed';

// SS Activewear API credentials
const SS_USERNAME = process.env.SS_USERNAME;
const SS_API_KEY = process.env.SS_API_KEY;

// Fetch products from SS Activewear API
async function fetchSSProducts(styleNumbers: string[]): Promise<Map<string, {
  styleId: number;
  styleName: string;
  brandName: string;
  description: string;
  variants: ProductVariant[];
}>> {
  if (!SS_USERNAME || !SS_API_KEY) {
    throw new Error('SS Activewear credentials not configured');
  }

  const auth = Buffer.from(`${SS_USERNAME}:${SS_API_KEY}`).toString('base64');
  const results = new Map();

  // Fetch styles to get style IDs
  const stylesResponse = await fetch('https://api.ssactivewear.com/v2/styles/', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!stylesResponse.ok) {
    throw new Error(`Failed to fetch styles: ${stylesResponse.status}`);
  }

  const allStyles = await stylesResponse.json();
  
  // Filter to our popular products and create a map
  const styleMap = new Map<string, { styleId: number; styleName: string; brandName: string; description: string }>();
  
  for (const style of allStyles) {
    const styleNum = style.styleNumber?.toString() || style.styleName?.split(' ')[0];
    if (styleNumbers.includes(styleNum)) {
      styleMap.set(styleNum, {
        styleId: style.styleID,
        styleName: style.title || style.styleName,
        brandName: style.brandName,
        description: style.description || '',
      });
    }
  }

  // Fetch products for matched styles (in batches)
  const styleIds = Array.from(styleMap.values()).map(s => s.styleId);
  const BATCH_SIZE = 25;
  
  for (let i = 0; i < styleIds.length; i += BATCH_SIZE) {
    const batchIds = styleIds.slice(i, i + BATCH_SIZE);
    const idsParam = batchIds.join(',');
    
    const productsResponse = await fetch(
      `https://api.ssactivewear.com/v2/products/?styleID=${idsParam}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (productsResponse.ok) {
      const products = await productsResponse.json();
      
      // Group products by style
      for (const product of products) {
        const styleInfo = Array.from(styleMap.entries()).find(
          ([, v]) => v.styleId === product.styleID
        );
        
        if (styleInfo) {
          const [styleNum, info] = styleInfo;
          
          if (!results.has(styleNum)) {
            results.set(styleNum, {
              ...info,
              variants: [],
            });
          }
          
          results.get(styleNum).variants.push({
            sku: product.sku,
            styleId: product.styleID,
            styleName: info.styleName,
            brandName: info.brandName,
            colorName: product.colorName,
            colorCode: product.colorCode,
            sizeName: product.sizeName,
            customerPrice: product.customerPrice || product.salePrice || 0,
            gtin: product.gtin,
            pieceWeight: product.pieceWeight,
            material: product.brandName, // SS API doesn't return material directly
            colorSwatchImage: product.colorSwatchImage,
            styleImage: product.styleImage,
          });
        }
      }
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const limit = parseInt(searchParams.get('limit') || '0') || undefined;
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://garmentdecor.com';
    
    // Get style numbers from popular products
    let styleNumbers = [...new Set(POPULAR_PRODUCTS.map(p => p.styleNumber))];
    
    if (limit) {
      styleNumbers = styleNumbers.slice(0, limit);
    }
    
    // Fetch product data from SS Activewear
    const productsMap = await fetchSSProducts(styleNumbers);
    
    // Generate feed rows
    const feedRows: GMCFeedRow[] = [];
    
    for (const product of POPULAR_PRODUCTS) {
      const ssProduct = productsMap.get(product.styleNumber);
      
      if (ssProduct && ssProduct.variants.length > 0) {
        // Create a row for each variant (color/size combination)
        for (const variant of ssProduct.variants) {
          const row = generateFeedRow(
            variant,
            product.category,
            product.tier,
            baseUrl
          );
          feedRows.push(row);
        }
      }
    }
    
    // Apply limit to rows if specified
    const finalRows = limit ? feedRows.slice(0, limit * 50) : feedRows;
    
    if (format === 'json') {
      return NextResponse.json({
        count: finalRows.length,
        products: finalRows,
      });
    }
    
    // Default: CSV format
    const csv = generateCSV(finalRows);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="garment-decor-gmc-feed.csv"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('GMC Feed Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate feed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support HEAD requests for feed validation
export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}
