// app/api/executive/route.ts
// Executive Open Source Intelligence API

import { type NextRequest, NextResponse } from 'next/server';
import type { ExecutiveData } from '@/types/executive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');

    if (!org) {
      return NextResponse.json({ error: 'Organization is required' }, { status: 400 });
    }

    const data = generateMockExecutiveData(org);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Executive API error:', error);
    return NextResponse.json({ error: 'Failed to fetch executive data' }, { status: 500 });
  }
}

function generateMockExecutiveData(org: string): ExecutiveData {
  return {
    organization: {
      totalRepos: 25,
      totalContributors: 150,
      totalStars: 12500,
      totalForks: 3200,
      avgHealth: 82,
      openSourceScore: 88,
    },
    scorecard: {
      codeQuality: 85,
      documentation: 72,
      communityEngagement: 90,
      security: 78,
      overall: 81,
    },
    repoHealth: [
      { name: 'main-repo', health: 92, stars: 5000, openIssues: 12, lastCommit: '2 hours ago' },
      { name: 'api-client', health: 88, stars: 2500, openIssues: 5, lastCommit: '1 day ago' },
      { name: 'docs', health: 95, stars: 800, openIssues: 2, lastCommit: '3 hours ago' },
      { name: 'cli-tool', health: 75, stars: 1200, openIssues: 18, lastCommit: '1 week ago' },
    ],
    insights: [
      { id: '1', category: 'performance', title: 'Community Growth', description: 'Contributors increased 25% this quarter', priority: 'high' },
      { id: '2', category: 'risk', title: 'Documentation Gap', description: 'API docs coverage below target', priority: 'medium' },
      { id: '3', category: 'opportunity', title: 'Open Source Initiative', description: 'Consider releasing core library as OSS', priority: 'low' },
    ],
  };
}
