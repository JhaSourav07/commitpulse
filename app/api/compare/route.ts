import { NextResponse } from 'next/server';
import { getFullDashboardData } from '@/lib/github';
import { compareParamsSchema } from '@/lib/validations';

export const revalidate = 3600;

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
    const [result1, result2] = await Promise.allSettled([
      getFullDashboardData(user1),
      getFullDashboardData(user2),
    ]);

    if (result1.status === 'rejected') {
      return NextResponse.json(
        {
          error: `Failed to fetch data for "${user1}": ${result1.reason?.message || 'Unknown error'}`,
        },
        { status: 404 }
      );
    }

    if (result2.status === 'rejected') {
      return NextResponse.json(
        {
          error: `Failed to fetch data for "${user2}": ${result2.reason?.message || 'Unknown error'}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user1: result1.value,
      user2: result2.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
