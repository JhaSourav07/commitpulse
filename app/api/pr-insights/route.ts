import { NextResponse } from 'next/server';
import { fetchPRInsights } from '@/services/github/pr-insights';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const data = await fetchPRInsights(username);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching PR insights:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch PR insights' },
      { status: 500 }
    );
  }
}
