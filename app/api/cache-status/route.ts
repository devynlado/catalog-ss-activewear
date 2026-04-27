import { NextResponse } from 'next/server';
import { getProductCacheStatus } from '@/lib/ss-activewear';

export async function GET() {
  const status = getProductCacheStatus();
  
  return NextResponse.json(status);
}
