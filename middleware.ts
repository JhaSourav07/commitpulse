import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

export function middleware(request: NextRequest) {
  // 1. Detect timezone from request headers
  const vercelTz = request.headers.get('x-vercel-ip-timezone');
  const cfTz = request.headers.get('cf-timezone') || request.headers.get('x-cloudflare-timezone');
  const customTz = request.headers.get('x-timezone');

  const detectedTimezone = customTz || vercelTz || cfTz || 'UTC';

  // Request headers are read-only, but we can set them on request cloning or response headers
  // To pass it down to server components and API routes in Next.js, we can set it in request headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-detected-timezone', detectedTimezone);

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith('/api');

  if (isApi) {
    // 2. Apply rate limiting to API routes
    // Use Vercel's ip property if available, fallback to headers, then localhost
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    // 60 requests per 60,000ms (1 minute)
    const limitResult = rateLimit(ip, 60, 60000);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.reset.toString(),
            'x-detected-timezone': detectedTimezone,
          },
        }
      );
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add rate limit headers to the response for successful requests
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', limitResult.reset.toString());

    // Set timezone headers/cookies
    response.headers.set('x-detected-timezone', detectedTimezone);
    response.cookies.set('detected-timezone', detectedTimezone, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });

    return response;
  }

  // Non-API routes (e.g. dashboard pages)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-detected-timezone', detectedTimezone);
  response.cookies.set('detected-timezone', detectedTimezone, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    '/api/streak/:path*',
    '/api/github/:path*',
    '/api/track-user/:path*',
    '/dashboard/:path*',
  ],
};
