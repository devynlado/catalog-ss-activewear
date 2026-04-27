import { NextRequest, NextResponse } from 'next/server';
import { getCompanionProducts } from '@/lib/ss-activewear';

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

    const companions = await getCompanionProducts(styleId);

    return NextResponse.json(companions);
  } catch (error) {
    console.error('Error fetching companion products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companion products' },
      { status: 500 }
    );
  }
}
