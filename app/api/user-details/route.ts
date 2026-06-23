import { NextResponse } from 'next/server';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { validateGitHubUsername } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter } from '@/lib/rate-limit';

const userDetailsLimiter = new RateLimiter(20, 60_000, 1);

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  if (!(await userDetailsLimiter.check(rateLimitKey))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
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
    const [profile, contributions] = await Promise.all([
      fetchUserProfile(username),
      fetchGitHubContributions(username).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '';
        // Propagate "not found" so both endpoints agree on user existence.
        // Swallow transient failures (rate limits, timeouts) and return partial data.
        if (msg.toLowerCase().includes('not found')) throw err;
        return null;
      }),
    ]);

    let stats = { currentStreak: 0, longestStreak: 0, totalContributions: 0 };
    if (contributions) {
      const calculated = calculateStreak(contributions.calendar);
      stats = {
        currentStreak: calculated.currentStreak,
        longestStreak: calculated.longestStreak,
        totalContributions: calculated.totalContributions,
      };
    }

    return NextResponse.json({
      exists: true,
      login: profile.login,
      name: profile.name,
      avatar_url: profile.avatar_url,
      public_repos: profile.public_repos,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('not found') || message.includes('404')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message || 'Failed to fetch user details' }, { status: 500 });
  }
}
