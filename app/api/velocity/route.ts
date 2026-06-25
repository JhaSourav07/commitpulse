// app/api/velocity/route.ts
// Engineering Velocity Intelligence API

import { type NextRequest, NextResponse } from 'next/server';
import type {
  VelocityData,
  VelocityKPI,
  TrendDataPoint,
  SprintMetrics,
  ProductivityInsight,
} from '@/types/velocity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const org = searchParams.get('org');
    const repo = searchParams.get('repo');
    const weeks = parseInt(searchParams.get('weeks') || '12', 10);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Generate mock velocity data (in production, this would fetch from GitHub API)
    const data = generateMockVelocityData(username, weeks);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Velocity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch velocity data' }, { status: 500 });
  }
}

function generateMockVelocityData(username: string, weeks: number): VelocityData {
  // Generate KPIs
  const kpis: VelocityKPI = {
    commitsPerWeek: Math.floor(Math.random() * 30) + 10,
    prsPerWeek: Math.floor(Math.random() * 10) + 3,
    reviewsPerWeek: Math.floor(Math.random() * 15) + 5,
    issuesClosedPerWeek: Math.floor(Math.random() * 8) + 2,
    avgCycleTime: Math.floor(Math.random() * 48) + 12,
    velocityTrend: Math.floor(Math.random() * 30) - 10,
  };

  // Generate trend data
  const trendData: TrendDataPoint[] = [];
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(weekDate.getDate() - i * 7);
    const weekStr = `${weekDate.getMonth() + 1}/${weekDate.getDate()}`;

    trendData.push({
      week: weekStr,
      commits: Math.floor(Math.random() * 30) + 5,
      prs: Math.floor(Math.random() * 10) + 2,
      reviews: Math.floor(Math.random() * 15) + 3,
      issues: Math.floor(Math.random() * 8) + 1,
      velocity: Math.floor(Math.random() * 100) + 50,
    });
  }

  // Generate sprint metrics
  const sprintMetrics: SprintMetrics = {
    currentSprint: `Sprint ${Math.floor(Math.random() * 10) + 1}`,
    commits: Math.floor(Math.random() * 50) + 20,
    prsMerged: Math.floor(Math.random() * 15) + 5,
    reviewsCompleted: Math.floor(Math.random() * 20) + 8,
    issuesClosed: Math.floor(Math.random() * 12) + 3,
    velocity: Math.floor(Math.random() * 100) + 80,
    previousVelocity: Math.floor(Math.random() * 100) + 70,
  };

  // Generate productivity insights
  const insights: ProductivityInsight[] = [
    {
      id: '1',
      type: 'positive',
      title: 'Consistent Commit Frequency',
      description: 'You have maintained a stable commit pattern over the past weeks.',
      metric: 'Commits',
      change: 15,
    },
    {
      id: '2',
      type: 'positive',
      title: 'PR Merge Rate Up',
      description: 'Your pull request merge rate has increased compared to last sprint.',
      metric: 'PRs Merged',
      change: 22,
    },
    {
      id: '3',
      type: 'neutral',
      title: 'Review Turnaround',
      description: 'Average time to complete code reviews is within normal range.',
      metric: 'Review Time',
      change: 0,
    },
  ];

  return {
    kpis,
    trendData,
    sprintMetrics,
    productivityInsights: insights,
  };
}
