import { NextRequest, NextResponse } from 'next/server';
import { analyzeCollaboration } from '@/lib/analytics/collaborationGraph';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId') || undefined;
  const repository = searchParams.get('repository') || undefined;

  const filter = { teamId, repository };
  const data = analyzeCollaboration(filter);

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
