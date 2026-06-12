import { NextResponse } from 'next/server';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { validateGitHubUsername } from '@/lib/validations';

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

  try {
    const data = await fetchPRInsights(trimmed);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching PR insights:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch PR insights' },
      { status: 500 }
    );
  }
}
