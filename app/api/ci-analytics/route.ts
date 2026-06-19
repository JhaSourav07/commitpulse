import { NextResponse } from 'next/server';
import { fetchCIAnalytics } from '@/services/github/ci-analytics';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { validateGitHubUsername } from '@/lib/validations';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';

const ciAnalyticsLimiter = new RateLimiter(10, 60_000, 10_000);

export async function GET(request: Request) {
  const ip = getClientIp(request);

  if (!(await ciAnalyticsLimiter.check(ip))) {
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
    return NextResponse.json({ error: 'Invalid GitHub username' }, { status: 400 });
  }

  try {
    const userToken = await getUserGitHubToken();
    const data = await fetchCIAnalytics(username, userToken);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching CI analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch CI analytics' },
      { status: 500 }
    );
  }
}
