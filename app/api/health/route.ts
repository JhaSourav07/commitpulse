import { NextResponse } from 'next/server';
import { checkGitHubHealth, getCircuitTelemetry } from '@/lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await checkGitHubHealth();
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        githubApi: 'error',
        message: error instanceof Error ? error.message : 'Unknown GitHub API error',
      },
      { status: 503 }
    );
  }
  const aggregate = quotaMonitor.getAggregateQuota();
  const circuit = getCircuitTelemetry();

  const status: 'healthy' | 'degraded' | 'exhausted' = circuit.isOpen
    ? 'exhausted'
    : aggregate.lowestRemainingPercent < 10
      ? 'degraded'
      : 'healthy';

  return NextResponse.json({
    status,
    githubApi: 'ok',
    quota: {
      totalTokens: aggregate.totalTokens,
      activeTokens: aggregate.activeTokens,
      aggregateLimit: aggregate.aggregateLimit,
      aggregateRemaining: aggregate.aggregateRemaining,
      usagePercent:
        aggregate.aggregateLimit > 0
          ? Math.round(
              ((aggregate.aggregateLimit - aggregate.aggregateRemaining) /
                aggregate.aggregateLimit) *
                100 *
                100
            ) / 100
          : 0,
      lowestRemainingPercent: aggregate.lowestRemainingPercent,
    },
    circuitBreaker: {
      isOpen: circuit.isOpen,
      resetsInMs: circuit.resetInMs,
    },
    totalRefreshes: aggregate.totalRefreshes,
    timestamp: new Date().toISOString(),
  });
}
