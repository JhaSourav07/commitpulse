import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Info } from 'luxon';
import { invalidateUserCache } from '@/lib/github';
import { trackUserRateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // Get IP for rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (ip !== 'unknown' && !trackUserRateLimiter.check(ip)) {
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
    const { username, timezone } = body as { username?: unknown; timezone?: unknown };

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing username' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    let validatedTimezone = 'UTC';

    if (timezone && typeof timezone === 'string') {
      if (Info.isValidIANAZone(timezone)) {
        validatedTimezone = timezone;
      } else {
        return NextResponse.json(
          { success: false, error: `Invalid timezone parameter: ${timezone}` },
          { status: 400 }
        );
      }
    }

    // If MONGODB_URI is not set, skip tracking to allow local development without a DB
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not set. Bypassing user tracking for local development.');
      return NextResponse.json({ success: true, bypassed: true });
    }

    // Connect to database
    await dbConnect();

    try {
      // Upsert the user: check if timezone changed first
      let timezoneChanged = false;
      const oldUser = await User.findOne({ username: trimmedUsername });
      if (oldUser) {
        timezoneChanged = oldUser.timezone !== validatedTimezone;
      } else {
        timezoneChanged = validatedTimezone !== 'UTC';
      }

      const updateObj = timezone
        ? {
            $set: { timezone: validatedTimezone },
            $setOnInsert: { username: trimmedUsername },
          }
        : { $setOnInsert: { username: trimmedUsername } };

      await User.findOneAndUpdate({ username: trimmedUsername }, updateObj, {
        upsert: true,
        new: true,
      });

      // If the timezone changed, invalidate the cache for this user
      if (timezoneChanged) {
        invalidateUserCache(trimmedUsername);
      }
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
