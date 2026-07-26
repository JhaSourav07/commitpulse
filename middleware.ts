import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getRateLimitHeaders } from './lib/rate-limit';
import { getClientIp } from './utils/getClientIp';
import { auth } from './auth';

const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

interface RouteRule {
  pattern: string;
  auth?: 'admin' | 'user' | false;
  rateLimit?:
    | {
        limit: number;
        windowMs: number;
        namespace: string;
      }
    | false;
}

const routeRules: RouteRule[] = [
  {
    pattern: '/api/enterprise',
    auth: 'admin',
    rateLimit: { limit: 60, windowMs: 60000, namespace: 'api' },
  },
  {
    pattern: '/api/architecture',
    auth: 'user',
    rateLimit: { limit: 60, windowMs: 60000, namespace: 'api' },
  },
  {
    pattern: '/api/track-user',
    rateLimit: { limit: 5, windowMs: 60000, namespace: 'track-user' },
  },
  {
    pattern: '/api/notify',
    rateLimit: { limit: 5, windowMs: 60000, namespace: 'notify' },
  },
];

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Centralized middleware to handle authentication, rate limiting, and security headers.
 */
export async function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const path = request.nextUrl.pathname;

  // Find matching route rule
  const rule = routeRules.find((r) => path.startsWith(r.pattern));

  // 1. Authentication and Authorization Check
  if (rule?.auth) {
    const session = await auth();
    if (!session?.user) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      );
    }

    if (rule.auth === 'admin') {
      const adminIds = (process.env.ENTERPRISE_ADMIN_GITHUB_IDS ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (adminIds.length === 0) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Enterprise admin access not configured' }, { status: 503 })
        );
      }

      const userId = session.user.id;
      if (!userId || !adminIds.includes(userId)) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Forbidden: enterprise admin access required' },
            { status: 403 }
          )
        );
      }
    }
  }

  // 2. Configurable Rate Limiting
  let limitResult;
  if (rule?.rateLimit !== false) {
    // Determine if this is a hard-refresh request (bypasses cache/hits GitHub API)
    const isRefreshRequest =
      request.nextUrl.searchParams.get('refresh') === 'true' ||
      request.nextUrl.searchParams.get('bypassCache') === 'true';

    if (isRefreshRequest) {
      // Strict rate limit for explicit refresh requests: 3 requests per 10 minutes (600,000ms)
      limitResult = await rateLimit(`refresh_limiter:${ip}`, 3, 600000, 'api');
    } else if (rule?.rateLimit) {
      limitResult = await rateLimit(
        ip,
        rule.rateLimit.limit,
        rule.rateLimit.windowMs,
        rule.rateLimit.namespace
      );
    } else {
      // Default rate limit: 60 requests per 1 minute (60,000ms)
      limitResult = await rateLimit(ip, 60, 60000, 'api');
    }

    if (!limitResult.success) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(limitResult),
            },
          }
        )
      );
    }
  }

  const response = NextResponse.next();

  // Apply Rate Limit Headers if rate limiting was executed
  if (limitResult) {
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', limitResult.reset.toString());
  }

  // Apply Global Security Headers
  return addSecurityHeaders(response);
}

/**
 * Configure which routes should trigger this middleware.
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
    '/api/enterprise/:path*',
  ],
};
