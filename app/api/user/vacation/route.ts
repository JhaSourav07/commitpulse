import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { z } from 'zod';

const vacationSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in YYYY-MM-DD format')),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const username = session.user.username.toLowerCase();
    const dbUser = await User.findOne({ username }).lean();
    return NextResponse.json({ vacationDates: dbUser?.vacationDates || [] });
  } catch (err: unknown) {
    console.error('Failed to get vacation dates:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parse = vacationSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid dates format. Must be an array of YYYY-MM-DD strings.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const username = session.user.username.toLowerCase();

    await User.updateOne(
      { username },
      {
        $setOnInsert: { username },
        $set: { vacationDates: parse.data.dates },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, vacationDates: parse.data.dates });
  } catch (err: unknown) {
    console.error('Failed to save vacation dates:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
