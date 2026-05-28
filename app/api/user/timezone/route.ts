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

    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing timezone' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (!Info.isValidIANAZone(timezone)) {
      return NextResponse.json(
        { success: false, error: `Invalid IANA timezone string: ${timezone}` },
        { status: 400 }
      );
    }

    // Connect to database
    if (process.env.MONGODB_URI) {
      await dbConnect();

      const oldUser = await User.findOne({ username: trimmedUsername });
      const timezoneChanged = !oldUser || oldUser.timezone !== timezone;

      await User.findOneAndUpdate(
        { username: trimmedUsername },
        {
          $set: { timezone },
          $setOnInsert: { username: trimmedUsername },
        },
        { upsert: true, new: true }
      );

      if (timezoneChanged) {
        invalidateUserCache(trimmedUsername);
      }
    } else {
      console.warn('MONGODB_URI is not set. Simulating timezone update in cache.');
      invalidateUserCache(trimmedUsername);
    }

    return NextResponse.json({ success: true, timezone });
  } catch (error) {
    console.error('Error updating user timezone:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
