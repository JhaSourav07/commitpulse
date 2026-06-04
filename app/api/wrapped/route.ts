import { NextResponse } from 'next/server';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { calculateWrappedStats } from '@/lib/calculate';
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
    const [profile, contributions] = await Promise.all([
      fetchUserProfile(username),
      fetchGitHubContributions(username),
    ]);

    const wrappedStats = calculateWrappedStats(contributions.calendar);

    return NextResponse.json({
      profile: {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
      },
      wrappedStats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('not found') || message.includes('404')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message || 'Failed to fetch wrapped data' }, { status: 500 });
  }
}
