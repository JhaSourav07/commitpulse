// app/api/productivity/route.ts
// Developer Productivity Intelligence API

import { type NextRequest, NextResponse } from 'next/server';
import type { ProductivityData } from '@/types/productivity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const org = searchParams.get('org');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const data = generateMockProductivityData(username);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Productivity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch productivity data' }, { status: 500 });
  }
}

function generateMockProductivityData(username: string): ProductivityData {
  const weeklyTrends = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(weekDate.getDate() - i * 7);
    weeklyTrends.push({
      week: `${weekDate.getMonth() + 1}/${weekDate.getDate()}`,
      commits: Math.floor(Math.random() * 30) + 5,
      prs: Math.floor(Math.random() * 8) + 2,
      reviews: Math.floor(Math.random() * 12) + 3,
      discussions: Math.floor(Math.random() * 5) + 1,
    });
  }

  const events = [];
  const types: Array<'commit' | 'pr' | 'review' | 'discussion'> = [
    'commit',
    'pr',
    'review',
    'discussion',
  ];
  for (let i = 0; i < 10; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    events.push({
      id: `event-${i}`,
      type,
      timestamp: new Date(Date.now() - i * 3600000 * Math.random() * 24).toISOString(),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} on ${username}/${['main', 'feature', 'bugfix'][Math.floor(Math.random() * 3)]}`,
      impact: (['high', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)],
    });
  }

  return {
    kpis: {
      totalCommits: Math.floor(Math.random() * 500) + 100,
      totalPRs: Math.floor(Math.random() * 100) + 20,
      totalReviews: Math.floor(Math.random() * 150) + 30,
      totalDiscussions: Math.floor(Math.random() * 50) + 10,
      avgResponseTime: Math.floor(Math.random() * 24) + 2,
      productivityScore: Math.floor(Math.random() * 30) + 70,
    },
    weeklyTrends,
    contributionQuality: {
      codeReviewQuality: Math.floor(Math.random() * 30) + 60,
      testCoverage: Math.floor(Math.random() * 40) + 50,
      documentationScore: Math.floor(Math.random() * 35) + 55,
      overallQuality: Math.floor(Math.random() * 25) + 65,
    },
    activityTimeline: events,
  };
}
