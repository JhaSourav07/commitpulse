import { NextResponse } from 'next/server';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { isAbortError } from '@/lib/github';
import { validateGitHubUsername } from '@/lib/validations';
import { getRateLimitHeaders, RateLimiter } from '@/lib/rate-limit';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { getClientIp } from '@/utils/getClientIp';

const prInsightsLimiter = new RateLimiter(10, 60_000, 10_000);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const trimmed = username.trim();
  if (trimmed.length > 39 || !validateGitHubUsername(trimmed)) {
    return NextResponse.json({ error: 'Invalid GitHub username' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await prInsightsLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const userToken = await getUserGitHubToken();
    const data = await fetchPRInsights(trimmed, userToken, controller.signal);

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching PR insights:', error);
    if (isAbortError(error)) {
      return NextResponse.json(
        { error: 'Upstream request timed out after 10 seconds.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch PR insights' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
