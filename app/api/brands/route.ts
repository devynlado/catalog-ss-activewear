import { NextResponse } from 'next/server';
import { getBrands } from '@/lib/ss-activewear';

export async function GET() {
  try {
    const brands = await getBrands();

    return NextResponse.json({
      data: brands,
      total: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
