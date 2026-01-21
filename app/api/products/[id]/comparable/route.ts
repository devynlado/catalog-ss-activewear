import { NextResponse } from 'next/server';
import { getComparableProducts } from '@/lib/ss-activewear';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const styleId = parseInt(params.id, 10);
    
    if (isNaN(styleId)) {
      return NextResponse.json(
        { error: 'Invalid style ID' },
        { status: 400 }
      );
    }

    const products = await getComparableProducts(styleId, 8);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching comparable products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparable products' },
      { status: 500 }
    );
  }
}
