import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON request body' },
      { status: 400 }
    );
  }

  try {
    const { username } = body as { username?: unknown };

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing username' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // If MONGODB_URI is not set, skip tracking to allow local development without a DB
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not set. Bypassing user tracking for local development.');
      return NextResponse.json({ success: true, bypassed: true });
    }

    // Connect to database
    await dbConnect();

    // Upsert the user: create if doesn't exist, do nothing if exists
    await User.findOneAndUpdate(
      { username: trimmedUsername },
      { $setOnInsert: { username: trimmedUsername } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking user:', error);

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
