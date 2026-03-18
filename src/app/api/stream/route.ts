import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');
  const range = request.headers.get('range') || undefined;

  // Handle HEAD for metadata
  if (request.method === 'HEAD') {
    if (!videoUrl) {
      return new NextResponse(null, { status: 400 });
    }
    try {
      const headRes = await fetch(videoUrl, { method: 'HEAD' });
      const headers = new Headers();
      headRes.headers.forEach((v, k) => {
        if (['content-type', 'content-length', 'accept-ranges'].includes(k.toLowerCase())) {
          headers.set(k, v);
        }
      });
      headers.set('Access-Control-Allow-Origin', '*');
      return new NextResponse(null, { status: 200, headers });
    } catch {
      return new NextResponse(null, { status: 500 });
    }
  }

  if (!videoUrl) {
    return new NextResponse(JSON.stringify({ error: 'Missing video URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const videoResponse = await fetch(videoUrl, {
      headers: range ? { 'Range': range! } : { 'User-Agent': 'Mozilla/5.0 (compatible; VideoProxy/1.0)' },
      cache: 'no-store',
    });

    if (!videoResponse.ok || !videoResponse.body) {
      const errorText = await videoResponse.text();
      return new NextResponse(
        JSON.stringify({
          error: `Failed to fetch video: ${videoResponse.statusText}`,
          details: errorText,
        }),
        {
          status: videoResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const headers = new Headers();
    // Copy all relevant headers from upstream
    videoResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (['content-type', 'content-length', 'content-range', 'accept-ranges', 
           'content-encoding', 'last-modified', 'etag'].includes(lowerKey)) {
        headers.set(key, value);
      }
    });
    
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', 'Range');
    headers.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new NextResponse(videoResponse.body, {
      status: range ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error while fetching video' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
