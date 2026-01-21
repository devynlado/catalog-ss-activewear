import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/ss-activewear';

export async function GET() {
  try {
    const categories = await getCategories();

    return NextResponse.json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
