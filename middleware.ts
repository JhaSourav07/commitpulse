import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { getClientIp } from './utils/getClientIp';

/**
 * Middleware to enforce rate limiting on specific API routes.
 */
export async function middleware(request: NextRequest) {
  // Extract client IP securely using the getClientIp helper
  const ip = getClientIp(request);

  // Determine if this is a hard-refresh request (bypasses cache/hits GitHub API)
  const isRefreshRequest =
    request.nextUrl.searchParams.get('refresh') === 'true' ||
    request.nextUrl.searchParams.get('bypassCache') === 'true';

  let result;

  if (isRefreshRequest) {
    // Strict rate limit for explicit refresh requests: 3 requests per 10 minutes (600,000ms)
    result = await rateLimit(`refresh_limiter:${ip}`, 3, 600000);
  } else {
    // Standard rate limit: 60 requests per 1 minute (60,000ms)
    result = await rateLimit(ip, 60, 60000);
  }

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

/**
 * Configure which routes should trigger this proxy.
 */
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
    '/api/architecture/:path*',
  ],
};
