import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/ss-activewear';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const styleId = parseInt(params.id, 10);
    
    if (isNaN(styleId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

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
