import { NextResponse } from 'next/server';
import { getFullDashboardData } from '@/lib/github';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get('user1');
  const user2 = searchParams.get('user2');

  if (!user1 || !user2) {
    return NextResponse.json(
      { error: 'Both user1 and user2 query parameters are required.' },
      { status: 400 }
    );
  }

  if (user1.toLowerCase() === user2.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot compare a user with themselves.' }, { status: 400 });
  }

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
