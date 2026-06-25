import { NextResponse } from 'next/server';
import { generateExecutiveDashboard } from '@/lib/analytics/executiveMetrics';

export async function GET() {
  const data = generateExecutiveDashboard();

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
