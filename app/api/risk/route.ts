import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepositoryRisk, calculatePortfolioRisk } from '@/lib/analytics/riskScoring';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoId = searchParams.get('repoId') || 'default-repo';
  const repoName = searchParams.get('repoName') || 'My Repository';

  const riskData = analyzeRepositoryRisk(repoId, repoName);

  return NextResponse.json(
    {
      success: true,
      data: riskData,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
