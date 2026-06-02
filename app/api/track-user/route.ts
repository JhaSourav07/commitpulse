import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { trackUserRateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { trackUserProtection } from '@/services/security/track-user-protection';

export async function POST(req: Request) {
  // Get IP for rate limiting securely
  const ip = getClientIp(req);

  if (ip !== '127.0.0.1' && ip !== 'unknown' && !(await trackUserRateLimiter.check(ip))) {
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

    // Coordinate security validations and deduplication checks
    const validation = await trackUserProtection.verifyAndDeduplicate(trimmedUsername);
    if (!validation.allowed) {
      if (validation.reason === 'COOLDOWN_ACTIVE') {
        // Return 200 OK with duplicate track indicator to bypass write and keep response fast
        return NextResponse.json(
          { success: true, message: 'User already tracked recently' },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Invalid GitHub username' },
        { status: 400 }
      );
    }

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
      trackUserProtection.recordWrite(trimmedUsername);
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

      // Record successful database write
      trackUserProtection.recordWrite(trimmedUsername);
    } catch (upsertError) {
      // Gracefully handle MongoDB E11000 duplicate key race conditions under high concurrency.
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
          trackUserProtection.recordWrite(trimmedUsername);
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
