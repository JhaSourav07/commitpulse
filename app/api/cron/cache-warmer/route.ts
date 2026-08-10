import { NextResponse } from 'next/server';
import { cacheWarmer } from '@/lib/cacheWarmer/scheduler';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  return handleCronExecution(req);
}

export async function POST(req: Request) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 100;

    const result = await cacheWarmer.runWarmupCycle(limit);

    return NextResponse.json({
      success: true,
      message: 'Cache warmup cycle executed successfully',
      warmedCount: result.warmedCount,
      durationMs: result.durationMs,
      users: result.users,
    });
  } catch (error) {
    logger.error('Cache Warmer Cron execution error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute cache warmup cycle',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
