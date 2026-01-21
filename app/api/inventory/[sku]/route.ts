import { NextRequest, NextResponse } from 'next/server';
import { getInventory, getInventoryMatrix } from '@/lib/ss-activewear';

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const styleId = parseInt(params.sku, 10);
    
    if (isNaN(styleId)) {
      return NextResponse.json(
        { error: 'Invalid style ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'matrix') {
      // Return inventory as a matrix (color -> size -> qty)
      const matrix = await getInventoryMatrix(styleId);
      
      // Convert Map to serializable object
      const matrixObject: Record<string, Record<string, number>> = {};
      matrix.forEach((sizeMap, colorCode) => {
        matrixObject[colorCode] = {};
        sizeMap.forEach((qty, size) => {
          matrixObject[colorCode][size] = qty;
        });
      });

      return NextResponse.json({
        styleId,
        matrix: matrixObject,
      });
    }

    // Return SKU-level inventory data
    const skuData = await getInventory(styleId);

    // Transform to simpler format for API consumers
    const inventory = skuData.map(sku => ({
      sku: sku.sku,
      styleID: sku.styleID,
      brandName: sku.brandName,
      styleName: sku.styleName,
      colorName: sku.colorName,
      colorCode: sku.colorCode,
      sizeName: sku.sizeName,
      qty: sku.qty,
      price: sku.piecePrice || sku.customerPrice,
    }));

    return NextResponse.json({
      styleId,
      data: inventory,
      total: inventory.length,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
