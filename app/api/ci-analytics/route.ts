import { NextResponse } from 'next/server';
import { fetchCIAnalytics } from '@/services/github/ci-analytics';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
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
