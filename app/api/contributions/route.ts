// app/api/contributions/route.ts

import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { githubUsernameSchema, coerceQueryParams } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter, getRateLimitHeaders } from '@/lib/rate-limit';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { getUserGitHubToken } from '@/lib/githubtoken';
import logger from '@/lib/logger';
import { z } from 'zod';

const contributionsLimiter = new RateLimiter(10, 60_000, 1000);

const contributionsParamsSchema = z.object({
  username: z.string().optional(),
  user: z.string().optional(),
  refresh: z.preprocess((val) => val === 'true' || val === '1', z.boolean()).default(false),
  bypassCache: z.preprocess((val) => val === 'true' || val === '1', z.boolean()).default(false),
  excludeBots: z.preprocess((val) => val === 'true' || val === '1', z.boolean()).default(false),
  token: z.string().optional(),
});

function getCallerToken(request: Request, searchParamToken?: string): string | undefined {
  if (searchParamToken && searchParamToken.trim().length > 0) {
    return searchParamToken.trim();
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  const customHeader = request.headers.get('x-github-token');
  if (customHeader && customHeader.trim().length > 0) {
    return customHeader.trim();
  }

  return undefined;
}

/**
 * Returns GitHub contribution data for a given user.
 *
 * Query params:
 * - username / user: GitHub username to fetch contribution statistics for
 * - refresh / bypassCache: Optional boolean to bypass cache
 * - token: Optional custom GitHub personal access token
 *
 * Header options for high-volume usage:
 * - Authorization: Bearer <token>
 * - x-github-token: <token>
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { searchParams } = new URL(request.url);
  const queryObj = coerceQueryParams(searchParams);
  const parseResult = contributionsParamsSchema.safeParse(queryObj);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const rawUsername = parseResult.data.username || parseResult.data.user;
  if (!rawUsername) {
    return NextResponse.json(
      { error: 'Missing required parameter: "username" or "user"' },
      { status: 400 }
    );
  }

  const usernameCheck = githubUsernameSchema.safeParse(rawUsername);
  if (!usernameCheck.success) {
    return NextResponse.json(
      { error: 'Invalid GitHub username', details: usernameCheck.error.flatten() },
      { status: 400 }
    );
  }
  const username = usernameCheck.data;

  const callerToken = getCallerToken(request, parseResult.data.token);
  const userSessionToken = await getUserGitHubToken();
  const effectiveToken = callerToken || userSessionToken;

  // Rate limiting check:
  // If caller supplies their own GitHub token, allow higher usage;
  // otherwise enforce per-IP rate limiting (10 req/min) to protect shared PAT quota.
  if (!callerToken) {
    const rateLimitKey =
      ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;
    const limitResult =
      typeof contributionsLimiter.checkWithResult === 'function'
        ? await contributionsLimiter.checkWithResult(rateLimitKey)
        : {
            success: await contributionsLimiter.check(rateLimitKey),
            limit: 10,
            remaining: 0,
            reset: Date.now() + 60000,
          };
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(limitResult),
        }
      );
    }
  }

  const isRefreshRequested = parseResult.data.refresh || parseResult.data.bypassCache;

  if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
    return NextResponse.json(
      { error: 'GitHub API quota is low. Cache refresh temporarily disabled.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  if (isRefreshRequested) {
    const rateLimitCheck = refreshRateLimiter.checkLimit(ip);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: 'Refresh rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitCheck) }
      );
    }
  }

  let shouldBypassCache = isRefreshRequested;
  if (isRefreshRequested) {
    if (!refreshPolicy.isRefreshAllowed(username)) {
      shouldBypassCache = false;
    } else {
      refreshPolicy.recordRefresh(username);
    }
  }

  try {
    const data = await fetchGitHubContributions(username, {
      bypassCache: shouldBypassCache,
      token: effectiveToken,
      excludeBots: parseResult.data.excludeBots,
    });

    const cacheControl = shouldBypassCache
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=60, stale-while-revalidate=300';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache-Status': shouldBypassCache ? 'MISS' : 'HIT',
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; response?: { status?: number }; message?: string };
    const status = err.status || err.response?.status;
    const message = err.message || '';

    if (
      status === 404 ||
      message.toLowerCase().includes('user not found') ||
      message.toLowerCase().includes('could not resolve')
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (
      status === 401 ||
      message.includes('401') ||
      message.toLowerCase().includes('bad credentials')
    ) {
      return NextResponse.json({ error: 'GitHub token is invalid or missing.' }, { status: 401 });
    }

    if (
      status === 403 ||
      message.toLowerCase().includes('rate limit') ||
      message.includes('API Rate Limit Exceeded')
    ) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    logger.error('Unhandled error in GET /api/contributions', { error });
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
