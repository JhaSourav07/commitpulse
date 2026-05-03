import { NextResponse } from 'next/server';
import { getFullDashboardData } from '@/lib/github';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const refresh = searchParams.get('refresh') === 'true';

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const data = await getFullDashboardData(username, { bypassCache: refresh });
    const cacheControl = refresh
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errMessage.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (errMessage.includes('API limit reached') || errMessage.includes('status 403')) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: errMessage || 'Internal Server Error' }, { status: 500 });
  }
}
