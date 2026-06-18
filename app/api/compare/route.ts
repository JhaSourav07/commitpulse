import { NextResponse } from 'next/server';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { compareParamsSchema } from '@/lib/validations';
import crypto from 'crypto';

export const revalidate = 3600;

function buildCompareFetchErrorResponse(user: string, reason: unknown): NextResponse {
  // Unwrap wrapped errors so the underlying cause (not found, rate limit, timeout) drives the status.
  let err: unknown = reason;
  while (err instanceof Error && err.cause instanceof Error) {
    err = err.cause;
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('not found') || lowerMessage.includes('could not resolve')) {
    return NextResponse.json(
      {
        error: `Failed to fetch data for "${user}". GitHub user "${user}" was not found.`,
      },
      { status: 404 }
    );
  }

  if (
    lowerMessage.includes('rate limit') ||
    message.includes('API limit reached') ||
    message.includes('status 403')
  ) {
    return NextResponse.json(
      { error: 'GitHub API rate limit reached. Please try again later.' },
      { status: 403 }
    );
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return NextResponse.json(
      { error: `Connection timeout. Unable to fetch GitHub data for "${user}".` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: `Unable to fetch GitHub data for "${user}". The upstream API returned an unexpected error.`,
    },
    { status: 502 }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = compareParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten();
    return NextResponse.json(
      { error: 'Invalid parameters', details: fieldErrors },
      { status: 400 }
    );
  }

  const { user1, user2 } = parseResult.data;

  try {
    const userToken = await getUserGitHubToken();
    const [result1, result2] = await Promise.allSettled([
      getFullDashboardData(user1, { token: userToken }),
      getFullDashboardData(user2, { token: userToken }),
    ]);

    if (result1.status === 'rejected') {
      return buildCompareFetchErrorResponse(user1, result1.reason);
    }

    if (result2.status === 'rejected') {
      return buildCompareFetchErrorResponse(user2, result2.reason);
    }

    const jsonPayload = JSON.stringify({
      user1: result1.value,
      user2: result2.value,
    });

    const etag = crypto.createHash('sha1').update(jsonPayload).digest('hex');
    const weakEtag = `W/"${etag}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    const cacheControl = 'public, s-maxage=3600';

    if (ifNoneMatch) {
      const etags = ifNoneMatch.split(',').map((e) => e.trim());
      if (etags.includes(weakEtag) || etags.includes(`"${etag}"`)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': cacheControl,
            ETag: weakEtag,
          },
        });
      }
    }

    return new NextResponse(jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl,
        ETag: weakEtag,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
