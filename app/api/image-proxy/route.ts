import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy for Otto Cap images hosted on Google Drive.
 * 
 * Google Drive URLs have CORS restrictions (cross-origin-resource-policy: same-site)
 * that prevent browsers from embedding them directly. This proxy fetches the image
 * server-side and serves it with proper CORS headers.
 * 
 * Usage: /api/image-proxy?url=https://drive.usercontent.google.com/download?id=xxx
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }
  
  // Only allow Google Drive URLs for security
  const isGoogleDrive = url.includes('drive.usercontent.google.com') || 
                        url.includes('drive.google.com');
  
  if (!isGoogleDrive) {
    return NextResponse.json({ error: 'Only Google Drive URLs are allowed' }, { status: 400 });
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GarmentDecor/1.0)',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
