import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

/**
 * Middleware to enforce rate limiting on specific API routes.
 *
 * Protected Routes:
 * - /api/streak
 * - /api/github
 * - /api/track-user
 * - /api/stats
 * - /api/og
 * - /api/notify
 *
 * Limit: 60 requests per minute per IP.
 */
export async function middleware(request: NextRequest) {
  // Use Vercel's ip property if available, fallback to headers, then localhost
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // Apply rate limiting
  // 60 requests per 60,000ms (1 minute)
  const result = await rateLimit(ip, 60, 60000);

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

  // Add rate limit headers to the response for successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

/**
 * Configure which routes should trigger this middleware.
 * Using a matcher is more efficient than checking pathnames inside the middleware.
 */
export const config = {
  matcher: [
    '/api/streak/:path*',
    '/api/github/:path*',
    '/api/track-user/:path*',
    '/api/stats/:path*',
    '/api/og/:path*',
    '/api/notify/:path*',
  ],
};
