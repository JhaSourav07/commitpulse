import { NextRequest, NextResponse } from 'next/server';
import { calculateLearningCurve, RawCommitActivity } from '@/utils/calculateLearningCurve';
import { fetchGithubUserActivity, transformToRawActivity } from '@/lib/github';

/**
 * GET /api/learning-curve?username=your_github_username
 * Fetches recent developer activity and processes it through the
 * Educational Syllabus Mapper to generate a structured learning timeline.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch real commit/contribution data using the resilient fetcher
    const githubData = await fetchGithubUserActivity(username);

    // 2. Transform the GraphQL nodes into a flat map
    const formattedActivities = transformToRawActivity(githubData);

    // 3. Adapt the GitHub type to match the Calculation Engine's expected type.
    // The current GraphQL query doesn't fetch lines added/deleted, so we default to 0.
    const compatibleActivities: RawCommitActivity[] = formattedActivities.map((activity) => ({
      date: activity.date,
      language: activity.language,
      commits: activity.commits,
      linesAdded: 0,
      linesDeleted: 0,
    }));

    // 4. Process the raw data through the Calculation Engine (Phase 2)
    const learningCurveData = calculateLearningCurve(compatibleActivities);

    // 5. Return the structured payload matching types/student.ts
    return NextResponse.json(
      {
        success: true,
        username,
        data: learningCurveData,
        meta: {
          analyzedDays: 30, // Assuming a 30-day rolling window based on 'first: 100' nodes
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
