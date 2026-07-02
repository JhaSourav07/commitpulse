// app/api/github/route.ts

import { NextResponse, after } from 'next/server';
import { getFullDashboardData } from '@/lib/github';
import { githubParamsSchema, coerceQueryParams } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { getRateLimitHeaders } from '@/lib/rate-limit';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { backgroundRefresh } from '@/services/github/background-refresh';
import { logger } from '@/lib/logger';

const MAX_ERROR_CAUSE_DEPTH = 10;

function getSafeRootCause(error: unknown): unknown {
  let currentErr: unknown = error;
  const visitedErrors = new WeakSet<object>();
  let depth = 0;

  while (
    currentErr &&
    typeof currentErr === 'object' &&
    'cause' in currentErr &&
    depth < MAX_ERROR_CAUSE_DEPTH
  ) {
    if (visitedErrors.has(currentErr)) {
      return currentErr;
    }

    visitedErrors.add(currentErr);
    currentErr = (currentErr as { cause?: unknown }).cause;
    depth += 1;
  }

  return currentErr;
}

function getSafeErrorMessage(error: unknown): string {
  const rootCause = getSafeRootCause(error);

  if (rootCause instanceof Error && rootCause.message) {
    return rootCause.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

function logSecurityEvent(event: string, details: Record<string, unknown>) {
  logger.warn('Security event', {
    type: 'SECURITY_EVENT',
    event,
    ...details,
  });
}

/**
 * Returns GitHub dashboard data as JSON.
 *
 * Query params:
 * - username: GitHub username to fetch dashboard statistics for
 * - refresh: Optional boolean to bypass cache and fetch fresh data
 *
 * Success (200):
 * - Returns dashboard profile, repositories, activity and contribution data
 *
 * Error codes:
 * - 400 → Invalid query parameters
 * - 403 → GitHub API rate limit reached
 * - 404 → GitHub user not found
 * - 429 → Too many requests (Refresh rate limit or low quota)
 * - 500 → Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);

  const parseResult = githubParamsSchema.safeParse(coerceQueryParams(searchParams));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { username, refresh, bypassCache: bypassCacheParam } = parseResult.data;
  // Treat either ?refresh=true or ?bypassCache=true as a cache-bypass request
  const isRefreshRequested = refresh || bypassCacheParam;

  // 1. Quota awareness check - if remaining quota is low, disable manual refresh
  if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
    logSecurityEvent('LOW_QUOTA_REFRESH_BLOCKED', {
      username,
      ip,
      remainingQuota: quotaMonitor.getQuota().remaining,
    });
    return NextResponse.json(
      { error: 'GitHub API quota is low. Cache refresh temporarily disabled.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 2. Separate Refresh Rate Limiter
  if (isRefreshRequested) {
    const rateLimitCheck = refreshRateLimiter.checkLimit(ip);
    if (!rateLimitCheck.success) {
      logSecurityEvent('REFRESH_RATE_LIMIT_EXCEEDED', {
        username,
        ip,
        limit: rateLimitCheck.limit,
      });
      return NextResponse.json(
        { error: 'Refresh rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitCheck),
        }
      );
    }
  }

  // 3. Per-Username Refresh Cooldown
  let shouldBypassCache = isRefreshRequested;
  if (isRefreshRequested) {
    if (!refreshPolicy.isRefreshAllowed(username)) {
      logSecurityEvent('REFRESH_COOLDOWN_VIOLATION', {
        username,
        ip,
        remainingMs: refreshPolicy.getRemainingCooldown(username),
      });
      // Fallback: serve cached data instead of bypassing cache
      shouldBypassCache = false;
    } else {
      refreshPolicy.recordRefresh(username);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const data = await getFullDashboardData(username, {
      bypassCache: shouldBypassCache,
      signal: controller.signal,
    });

    // 4. Stale-While-Revalidate background refresh for normal cached requests
    if (!shouldBypassCache) {
      const lastSynced = data.lastSyncedAt;
      if (backgroundRefresh.isStale(lastSynced)) {
        // Run after the response is sent so Vercel does not freeze the function mid-refresh.
        after(() => backgroundRefresh.triggerRefresh(username));
      }
    }

    const cacheControl = shouldBypassCache
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate=86400';

    const cacheStatus = shouldBypassCache ? 'MISS' : 'HIT';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache-Status': cacheStatus,
        'X-Refresh-Status': shouldBypassCache
          ? 'Fresh'
          : isRefreshRequested
            ? 'Cooldown-Served-Cached'
            : 'Cached',
      },
    });
  } catch (error: unknown) {
    const rootCause = getSafeRootCause(error);

    const err = (rootCause || error) as {
      status?: number;
      response?: { status?: number };
      message?: string;
    };

    const status = err.status || err.response?.status || undefined;
    const message = err.message || '';

    // 404 - User not found (status-first; exact message match as fallback for GraphQL paths
    // that throw without an HTTP status, e.g. `new Error('User not found')` in lib/github.ts)
    if (status === 404 || message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 401 - Invalid or missing token
    if (status === 401) {
      return NextResponse.json(
        { error: 'GitHub token is invalid or missing. Please configure GITHUB_TOKEN.' },
        { status: 401 }
      );
    }

    // 403 - Forbidden / rate limit exhausted (x-ratelimit-remaining: 0)
    if (status === 403) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    // 429 - Too many requests
    if (status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Fallback for GraphQL-level rate limit errors that arrive with HTTP 200
    // (lib/github.ts throws `new Error('API Rate Limit Exceeded')` in this case).
    if (!status && message === 'API Rate Limit Exceeded') {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    // Default fallback
    const errMessage = getSafeErrorMessage(error);

    return NextResponse.json({ error: errMessage }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
