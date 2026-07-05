import { NextResponse } from 'next/server';
import { fetchUserRepos } from '@/lib/github';
import { validateGitHubUsername } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { getRateLimitHeaders, RateLimiter } from '@/lib/rate-limit';

const reposLimiter = new RateLimiter(20, 60_000, 1);

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await reposLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim();

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  if (!validateGitHubUsername(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }

  try {
    const repos = await fetchUserRepos(username);

    // Sort by pushed_at or stargazers_count if preferred
    const sortedRepos = repos.sort((a, b) => {
      const aDate = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
      const bDate = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
      return bDate - aDate;
    });

    return NextResponse.json({ repos: sortedRepos });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('not found') || message.includes('404')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message || 'Failed to fetch repositories' }, { status: 500 });
  }
}
