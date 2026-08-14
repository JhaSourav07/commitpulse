import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Watchlist } from '@/models/Watchlist';
import { cacheWarmer } from '@/lib/cacheWarmer/scheduler';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.username || typeof body.username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required and must be a string' },
        { status: 400 }
      );
    }

    const cleanUser = body.username.trim().toLowerCase();
    if (!cleanUser) {
      return NextResponse.json(
        { success: false, error: 'Username cannot be empty' },
        { status: 400 }
      );
    }

    // Persist to MongoDB
    if (process.env.MONGODB_URI) {
      await dbConnect();
      await Watchlist.findOneAndUpdate(
        { username: cleanUser },
        { username: cleanUser, subscribedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Immediately warm user cache
    try {
      await cacheWarmer.warmCache(cleanUser);
    } catch (warmErr) {
      logger.warn(`Watchlist API: cache warming encountered non-fatal error for ${cleanUser}`, {
        error: warmErr instanceof Error ? warmErr.message : String(warmErr),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User added to watchlist and cache warming initiated',
        username: cleanUser,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Watchlist POST error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true, watchlist: [] });
    }

    await dbConnect();
    const watchlist = await Watchlist.find({}).sort({ subscribedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: watchlist.length,
      watchlist,
    });
  } catch (error) {
    logger.error('Watchlist GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let username = searchParams.get('username');

    if (!username) {
      const body = await req.json().catch(() => null);
      if (body && typeof body.username === 'string') {
        username = body.username;
      }
    }

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username query param or body field is required' },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();

    if (process.env.MONGODB_URI) {
      await dbConnect();
      await Watchlist.deleteOne({ username: cleanUser });
    }

    return NextResponse.json({
      success: true,
      message: `User ${cleanUser} removed from watchlist`,
    });
  } catch (error) {
    logger.error('Watchlist DELETE error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
