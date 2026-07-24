// app/api/learning-curve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { calculateLearningCurve, RawCommitActivity } from '@/utils/calculateLearningCurve';

/**
 * GET /api/learning-curve?username=your_github_username
 * * Fetches recent developer activity and processes it through the
 * Educational Syllabus Mapper to generate a structured learning timeline.
 */
export async function GET(req: NextRequest) {
  // 1. Extract username from query parameters
  const searchParams = req.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    // 2. Fetch data (Hook this up to your existing lib/github.ts later)
    // Normally, you would query GitHub's GraphQL API here to get
    // `contributionsCollection.commitContributionsByRepository` to find languages used per commit.

    // const githubData = await fetchGithubUserActivity(username);
    // const formattedActivities = transformToRawActivity(githubData);

    // --- FALLBACK / MOCK DATA FOR IMMEDIATE TESTING ---
    // We are generating dates relative to today so the frontend will always show active streaks!
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const twoDaysAgo = new Date(today.getTime() - 86400000 * 2);
    const threeDaysAgo = new Date(today.getTime() - 86400000 * 3);

    const mockActivities: RawCommitActivity[] = [
      // A burst of Data Mining / AI work today
      {
        date: today.toISOString().split('T')[0],
        language: 'Python',
        linesAdded: 150,
        linesDeleted: 20,
      },
      {
        date: today.toISOString().split('T')[0],
        language: 'Jupyter Notebook',
        linesAdded: 300,
        linesDeleted: 50,
      },

      // Some Full-Stack work yesterday
      {
        date: yesterday.toISOString().split('T')[0],
        language: 'TypeScript',
        linesAdded: 80,
        linesDeleted: 10,
      },
      {
        date: yesterday.toISOString().split('T')[0],
        language: 'Tailwind',
        linesAdded: 45,
        linesDeleted: 5,
      },

      // Heavy Computer Architecture work two days ago
      {
        date: twoDaysAgo.toISOString().split('T')[0],
        language: 'C++',
        linesAdded: 400,
        linesDeleted: 100,
      },

      // More AI work three days ago
      {
        date: threeDaysAgo.toISOString().split('T')[0],
        language: 'Python',
        linesAdded: 50,
        linesDeleted: 0,
      },
    ];

    // 3. Process the raw data through the Calculation Engine (Phase 2)
    const learningCurveData = calculateLearningCurve(mockActivities);

    // 4. Return the structured payload matching types/student.ts
    return NextResponse.json(
      {
        success: true,
        username,
        data: learningCurveData,
        meta: {
          analyzedDays: 30, // Assuming a 30-day rolling window
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Learning Curve API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate learning curve',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
