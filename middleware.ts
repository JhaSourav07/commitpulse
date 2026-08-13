import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getRateLimitHeaders } from './lib/rate-limit';
import { getClientIp } from './utils/getClientIp';
import { auth } from './auth';
import { generateRateLimitSVG } from './lib/svg/generator';

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

const ROUTES_WITH_OWN_RATE_LIMITING = [
  '/api/spotlight',
  '/api/reviews',
  '/api/achievements',
  '/api/ci-analytics',
  '/api/user-repos',
  '/api/team-attribution',
  '/api/repo-burnout',
  '/api/webhook',
  '/api/articles',
  '/api/learning-curve',
  '/api/org',
  '/api/spotify', // Added here in case it has its own rate limiter
  '/api/languages',
  '/api/tech-stack',
];

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function isStreakBadgeRequest(path: string): boolean {
  return path === '/api/streak' || path.startsWith('/api/streak/');
}

function createStreakRateLimitResponse(limitResult: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  const svg = generateRateLimitSVG('0d1117', '58a6ff', 'c9d1d9', 8, '8s');

  return new NextResponse(svg, {
    status: 429,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
      ...getRateLimitHeaders(limitResult),
    },
  });
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

  // Check if route has its own local rate limiter to avoid double-limiting
  const hasOwnRateLimiter = ROUTES_WITH_OWN_RATE_LIMITING.some((p) => path.startsWith(p));

  // 2. Configurable Rate Limiting
  let limitResult;
  if (rule?.rateLimit !== false && !hasOwnRateLimiter) {
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
      if (isStreakBadgeRequest(path)) {
        return addSecurityHeaders(createStreakRateLimitResponse(limitResult));
      }

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
    '/api/languages/:path*',
    '/api/track-user/:path*',
    '/api/stats/:path*',
    '/api/og/:path*',
    '/api/notify/:path*',
    '/api/compare/:path*',
    '/api/wrapped/:path*',
    '/api/student/:path*',
    '/api/pr-insights/:path*',
    '/api/architecture/:path*',
    '/api/articles/:path*',
    '/api/languages/:path*',
    '/api/learning-curve/:path*',
    '/api/languages/:path*',
    '/api/org/:path*',
    '/api/spotify/:path*',
    '/api/auth/:path*',
    '/api/achievements/:path*',
    '/api/ci-analytics/:path*',
    '/api/cicd/:path*',
    '/api/enterprise/:path*',
    '/api/languages/:path*',
    '/api/health/:path*',
    '/api/insights-og/:path*',
    '/api/languages/:path*',
    '/api/repo-burnout/:path*',
    '/api/reviews/:path*',
    '/api/spotlight/:path*',
    '/api/team-attribution/:path*',
    '/api/user/:path*',
    '/api/wakatime/:path*',
    '/api/user-details/:path*',
    '/api/user-repos/:path*',
    '/api/webhook/:path*',
    '/api/webhooks/:path*',
    '/api/cron/:path*',
    '/api/languages/:path*',
  ],
};
