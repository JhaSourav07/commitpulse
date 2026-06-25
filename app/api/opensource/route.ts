import { NextRequest, NextResponse } from 'next/server';
import { analyzeOSSHealth } from '@/lib/analytics/ossHealth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId') || 'oss-project-1';
  const projectName = searchParams.get('projectName') || 'My Open Source Project';

  const data = analyzeOSSHealth(projectId, projectName);

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
