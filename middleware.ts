import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Detect timezone from request headers
  const vercelTz = request.headers.get('x-vercel-ip-timezone');
  const cfTz = request.headers.get('cf-timezone') || request.headers.get('x-cloudflare-timezone');
  const customTz = request.headers.get('x-timezone');

  const detectedTimezone = customTz || vercelTz || cfTz || 'UTC';

  // Request headers are read-only, but we can set them on request cloning or response headers
  // To pass it down to server components and API routes in Next.js, we can set it in request headers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-detected-timezone', detectedTimezone);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also set a response header and a cookie for client accessibility
  response.headers.set('x-detected-timezone', detectedTimezone);
  response.cookies.set('detected-timezone', detectedTimezone, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return response;
}

// Configure middleware matcher for API routes and dashboards
export const config = {
  matcher: ['/api/streak', '/api/track-user', '/dashboard/:path*'],
};
