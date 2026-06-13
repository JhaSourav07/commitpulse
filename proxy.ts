import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

/**
 * Proxy to enforce rate limiting on specific API routes.
 */
export async function proxy(request: NextRequest) {
  // Use Vercel's ip property if available, fallback to headers, then localhost
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Analyze URL parameters for cache-exhaustion vectors
  const { searchParams } = new URL(request.url);
  const isCacheBypass =
    searchParams.get('refresh') === 'true' || searchParams.get('bypassCache') === 'true';

  // FIX #3708 Part 1: Enforce strict sliding window on cache-bypassing parameters
  if (isCacheBypass) {
    const cacheBypassResult = await rateLimit(`bypassCache:${ip}`, 3, 600000);
    if (!cacheBypassResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': cacheBypassResult.limit.toString(),
            'X-RateLimit-Remaining': cacheBypassResult.remaining.toString(),
            'X-RateLimit-Reset': cacheBypassResult.reset.toString(),
          },
        }
      );
    }
  }

  // STANDARD REGULAR RATE LIMIT: Baseline rate limiting
  const result = await rateLimit(`bypassCache:${ip}`, 3, 600000);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

export const config = {
  matcher: [
    '/api/streak/:path*',
    '/api/github/:path*',
    '/api/track-user/:path*',
    '/api/stats/:path*',
    '/api/og/:path*',
    '/api/notify/:path*',
    '/api/compare/:path*',
    '/api/wrapped/:path*',
    '/api/student/:path*',
    '/api/pr-insights/:path*',
  ],
};
