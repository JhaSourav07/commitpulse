import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Info } from 'luxon';
import { invalidateUserCache } from '@/lib/github';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, timezone } = body;

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

    // Upsert the user: create or update the timezone
    let timezoneChanged = false;
    if (timezone && typeof User.findOne === 'function') {
      const oldUser = await User.findOne({ username: trimmedUsername });
      timezoneChanged = oldUser && oldUser.timezone !== validatedTimezone;
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking user:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
