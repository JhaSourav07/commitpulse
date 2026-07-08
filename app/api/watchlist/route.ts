// app/api/watchlist/route.ts
import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { CacheWarmerScheduler } from '@/lib/cacheWarmer/scheduler';

const cacheWarmer = new CacheWarmerScheduler();

// POST /api/watchlist - Add user to watchlist
export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const existing = await cache.get('watchlist');
    const watchlist = existing ? JSON.parse(existing) : [];

    if (!watchlist.includes(username)) {
      watchlist.push(username);
      await cache.set('watchlist', JSON.stringify(watchlist), { ttl: 60 * 60 * 24 * 30 });

      // Warm cache for this user
      await cacheWarmer.warmCache(username);
    }

    return NextResponse.json({
      success: true,
      message: `Added ${username} to watchlist`,
      user: username,
      watchlist,
    });
  } catch (error) {
    console.error('Watchlist add error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

// GET /api/watchlist - Get watchlist
export async function GET() {
  try {
    const data = await cache.get('watchlist');
    const watchlist = data ? JSON.parse(data) : [];
    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Watchlist get error:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

// DELETE /api/watchlist - Remove from watchlist
export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();

    const data = await cache.get('watchlist');
    let watchlist = data ? JSON.parse(data) : [];
    watchlist = watchlist.filter((u: string) => u !== username);

    await cache.set('watchlist', JSON.stringify(watchlist), { ttl: 60 * 60 * 24 * 30 });

    return NextResponse.json({
      success: true,
      message: `Removed ${username} from watchlist`,
      watchlist,
    });
  } catch (error) {
    console.error('Watchlist remove error:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
