// app/api/github/route.ts

import { NextResponse } from 'next/server';
import { getFullDashboardData } from '@/lib/github';
import { githubParamsSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { backgroundRefresh } from '@/services/github/background-refresh';

function logSecurityEvent(event: string, details: Record<string, unknown>) {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      event,
      ...details,
    })
  );
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

  const parseResult = githubParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { username, refresh } = parseResult.data;

  // 1. Quota awareness check - if remaining quota is low, disable manual refresh
  if (refresh && quotaMonitor.isQuotaLow()) {
    logSecurityEvent('LOW_QUOTA_REFRESH_BLOCKED', {
      username,
      ip,
      remainingQuota: quotaMonitor.getQuota().remaining,
    });
    return NextResponse.json(
      { error: 'GitHub API quota is low. Cache refresh temporarily disabled.' },
      { status: 429 }
    );
  }

  // 2. Separate Refresh Rate Limiter
  if (refresh) {
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
          headers: {
            'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.reset.toString(),
          },
        }
      );
    }
  }

  // 3. Per-Username Refresh Cooldown
  let shouldBypassCache = refresh;
  if (refresh) {
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

  try {
    const data = await getFullDashboardData(username, { bypassCache: shouldBypassCache });

    // 4. Stale-While-Revalidate background refresh for normal cached requests
    if (!shouldBypassCache) {
      const lastSynced = data.lastSyncedAt;
      if (backgroundRefresh.isStale(lastSynced)) {
        backgroundRefresh.triggerRefresh(username);
      }
    }

    const cacheControl = shouldBypassCache
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate=86400';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Refresh-Status': shouldBypassCache
          ? 'Fresh'
          : refresh
            ? 'Cooldown-Served-Cached'
            : 'Cached',
      },
    });
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      response?: { status?: number };
      message?: string;
    };

    const status = err.status || err.response?.status || undefined;

    const message = err.message?.toLowerCase?.() || '';

    // 404 - User not found
    if (status === 404 || message.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 401/403 - Auth or rate limit
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached or unauthorized. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    // 429 - Too many requests
    if (status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Fallback safety check for known GitHub rate-limit signals (only if no status exists)
    const looksLikeRateLimit =
      message.includes('rate limit') || message.includes('api limit reached');

    if (!status && looksLikeRateLimit) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    // Default fallback
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
