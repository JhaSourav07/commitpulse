import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { trackUserRateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // Get IP for rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (ip !== 'unknown' && !(await trackUserRateLimiter.check(ip))) {
    return NextResponse.json(
      { success: false, error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

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

    // If MONGODB_URI is not set, handle based on environment
    if (!process.env.MONGODB_URI) {
      // In production, this is a critical configuration failure
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'CRITICAL: MONGODB_URI is not set in production environment. User tracking is disabled.'
        );
        return NextResponse.json(
          { success: false, error: 'Database configuration error' },
          { status: 500 }
        );
      }

      // For development/non-production environments, bypass gracefully
      console.warn('MONGODB_URI is not set. Bypassing user tracking for local development.');
      return NextResponse.json({ success: true, bypassed: true });
    }

    // Connect to database
    await dbConnect();

    try {
      // Upsert the user: create if doesn't exist, do nothing if exists
      await User.updateOne(
        { username: trimmedUsername },
        {
          $setOnInsert: { username: trimmedUsername },
          $set: { lastSeen: new Date() },
          $inc: { visitCount: 1 },
        },
        { upsert: true }
      );
    } catch (upsertError) {
      // Gracefully handle MongoDB E11000 duplicate key race conditions under high concurrency.
      // Concurrent upserts for the same username can race on the unique index, causing
      // MongoDB to throw a duplicate key error (code 11000) for one of the requests.
      // We can safely treat this as a successful no-op because another request already created it.
      if (
        upsertError &&
        typeof upsertError === 'object' &&
        'code' in upsertError &&
        upsertError.code === 11000
      ) {
        const err = upsertError as Record<string, unknown>;
        const isUsernameConflict =
          (err.keyPattern && typeof err.keyPattern === 'object' && 'username' in err.keyPattern) ||
          (err.keyValue && typeof err.keyValue === 'object' && 'username' in err.keyValue) ||
          (typeof err.message === 'string' && err.message.includes('username'));

        if (isUsernameConflict) {
          return NextResponse.json({ success: true });
        }
      }
      throw upsertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking user:', error);

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
