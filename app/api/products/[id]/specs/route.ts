import { NextRequest, NextResponse } from 'next/server';
import { getProductSpecs } from '@/lib/ss-activewear';

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

    const specs = await getProductSpecs(styleId);

    return NextResponse.json(specs);
  } catch (error) {
    console.error('Error fetching product specs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product specs' },
      { status: 500 }
    );
  }
}
