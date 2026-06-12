import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { getClientIp } from './utils/getClientIp';

/**
 * Next.js middleware — rate-limits all matched API routes.
 *
 * Next.js requires this file to be named `middleware.ts` at the project root
 * and to export a function named `middleware` (and optionally `config`).
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);

  const isRefresh =
    request.nextUrl.searchParams.get('refresh') === 'true' ||
    request.nextUrl.searchParams.get('bypassCache') === 'true';

  if (isRefresh) {
    const refreshResult = await rateLimit(`refresh:${ip}`, 5, 60000);

    if (!refreshResult.success) {
      const resp = NextResponse.json(
        { error: 'Too many refresh requests. Please wait before bypassing the cache again.' },
        { status: 429 }
      );
      resp.headers.set('X-RateLimit-Limit', refreshResult.limit.toString());
      resp.headers.set('X-RateLimit-Remaining', '0');
      resp.headers.set('X-RateLimit-Reset', refreshResult.reset.toString());
      resp.headers.set('X-RateLimit-Policy', 'refresh');
      return resp;
    }
  }

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
  ],
};
