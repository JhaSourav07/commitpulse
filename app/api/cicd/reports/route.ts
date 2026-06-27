import { NextRequest, NextResponse } from 'next/server';
import { generateCIReport } from '@/services/github/webhook-handler';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';

    if (!repository) {
      return NextResponse.json({ error: 'Repository parameter is required' }, { status: 400 });
    }

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use: daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    const report = generateCIReport([], period);

    return NextResponse.json({
      success: true,
      report,
      repository,
      period,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
