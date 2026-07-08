// app/api/cron/warm-cache/route.ts
import { NextResponse } from 'next/server';
import { CacheWarmerScheduler } from '@/lib/cacheWarmer/scheduler';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scheduler = new CacheWarmerScheduler();
    scheduler.runWarmupCycle().catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Cache warming cycle initiated',
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to run warming cycle' }, { status: 500 });
  }
}
