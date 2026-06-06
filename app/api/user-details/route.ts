import { NextResponse } from 'next/server';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { validateGitHubUsername } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim();

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  if (!validateGitHubUsername(username)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
  }

  try {
    // Treat a failed contributions fetch as a first-class error rather than
    // silently returning zeroed stats, which would present a false "no activity"
    // result and make it impossible for clients to distinguish between a user
    // with zero contributions and a failed API call.
    const [profile, contributions] = await Promise.all([
      fetchUserProfile(username),
      fetchGitHubContributions(username),
    ]);

    const calculated = calculateStreak(contributions.calendar);
    const stats = {
      currentStreak: calculated.currentStreak,
      longestStreak: calculated.longestStreak,
      totalContributions: calculated.totalContributions,
    };

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
    if (message.toLowerCase().includes('rate limit')) {
      return NextResponse.json({ error: 'API Rate Limit Exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: message || 'Failed to fetch user details' }, { status: 500 });
  }
}
