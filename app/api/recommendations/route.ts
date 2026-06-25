// app/api/recommendations/route.ts
// AI Repository Recommendation Engine API

import { type NextRequest, NextResponse } from 'next/server';
import type { RecommendationData } from '@/types/recommendation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const data = generateMockRecommendations(username);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

function generateMockRecommendations(username: string): RecommendationData {
  return {
    repositories: [
      { id: '1', repo: { name: 'awesome-react', fullName: 'user/awesome-react', description: 'A curated list of React libraries', stars: 15000, language: 'JavaScript', topics: ['react', 'frontend'] }, reason: 'Based on your React experience', matchScore: 95, type: 'repository' },
      { id: '2', repo: { name: 'typescript-toolbox', fullName: 'org/typescript-toolbox', description: 'Essential TypeScript utilities', stars: 8500, language: 'TypeScript', topics: ['typescript', 'tools'] }, reason: 'Matches your TypeScript contributions', matchScore: 88, type: 'repository' },
    ],
    issues: [
      { id: '3', repo: 'awesome-react', issueNumber: 142, title: 'Add dark mode support', description: 'Implement dark mode toggle', difficulty: 'beginner', labels: ['good-first-issue', 'enhancement'], matchScore: 92 },
      { id: '4', repo: 'typescript-toolbox', issueNumber: 87, title: 'Improve type safety', description: 'Add stricter types', difficulty: 'intermediate', labels: ['help-wanted', 'typescript'], matchScore: 85 },
    ],
    technologies: [
      { technology: 'React', score: 92, usage: ['Components', 'Hooks', 'State Management'] },
      { technology: 'TypeScript', score: 88, usage: ['Types', 'Generics', 'Utility Types'] },
      { technology: 'Node.js', score: 75, usage: ['APIs', 'CLI Tools', 'Backend'] },
    ],
    contributionOpportunities: [
      { id: '5', type: 'good_first_issue', title: 'Documentation update needed', repo: 'docs-repo', description: 'Improve README examples', impact: 'medium' },
    ],
  };
}
