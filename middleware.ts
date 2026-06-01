import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

function generateRateLimitSVG() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
  <rect width="420" height="120" rx="16" fill="#0f172a"/>
  <text x="210" y="52" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="20" font-weight="700">
    Rate Limit Exceeded
  </text>
  <text x="210" y="82" text-anchor="middle" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">
    Please try again later
  </text>
</svg>`;
}

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

  const rateLimitHeaders = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    if (request.nextUrl.pathname.startsWith('/api/streak')) {
      return new NextResponse(generateRateLimitSVG(), {
        status: 429,
        headers: {
          'Content-Type': 'image/svg+xml',
          ...rateLimitHeaders,
        },
      });
    }

    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders,
        },
      }
    );
  }

  // Add rate limit headers to the response for successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', rateLimitHeaders['X-RateLimit-Limit']);
  response.headers.set('X-RateLimit-Remaining', rateLimitHeaders['X-RateLimit-Remaining']);
  response.headers.set('X-RateLimit-Reset', rateLimitHeaders['X-RateLimit-Reset']);

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
