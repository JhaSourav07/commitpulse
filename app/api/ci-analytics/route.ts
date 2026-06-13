import { NextResponse } from 'next/server';
import { fetchCIAnalytics } from '@/services/github/ci-analytics';
import { validateGitHubUsername } from '@/lib/validations';
import { RateLimiter } from '@/lib/rate-limit';

const ciAnalyticsLimiter = new RateLimiter(10, 60_000, 1);

export async function GET(request: Request) {
  if (!(await ciAnalyticsLimiter.check('ci-analytics'))) {
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
    const data = await fetchCIAnalytics(username);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching CI analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch CI analytics' },
      { status: 500 }
    );
  }
}
