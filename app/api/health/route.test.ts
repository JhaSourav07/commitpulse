import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  checkGitHubHealth: vi.fn(),
  getCircuitTelemetry: vi.fn(),
}));

vi.mock('@/services/github/quota-monitor', () => ({
  quotaMonitor: {
    getAggregateQuota: vi.fn(),
  },
}));

import { checkGitHubHealth, getCircuitTelemetry } from '@/lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(checkGitHubHealth).mockResolvedValue(undefined);

    vi.mocked(getCircuitTelemetry).mockReturnValue({
      isOpen: false,
      resetInMs: 0,
    });

    vi.mocked(quotaMonitor.getAggregateQuota).mockReturnValue({
      totalTokens: 1,
      activeTokens: 1,
      aggregateLimit: 5000,
      aggregateRemaining: 4500,
      lowestRemainingPercent: 90,
      totalRefreshes: 0,
    });
  });

  it('returns 200 when GitHub health check succeeds', async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.status).toBe('healthy');
    expect(body.githubApi).toBe('ok');
    expect(body.quota).toBeDefined();
    expect(body.circuitBreaker).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 when GitHub health check fails', async () => {
    vi.mocked(checkGitHubHealth).mockRejectedValue(new Error('Bad credentials'));

    const response = await GET();

    expect(response.status).toBe(503);

    const body = await response.json();

    expect(body.status).toBe('degraded');
    expect(body.githubApi).toBe('error');
    expect(body.message).toContain('Bad credentials');
  });

  it('returns exhausted when the circuit breaker is open', async () => {
    vi.mocked(getCircuitTelemetry).mockReturnValue({
      isOpen: true,
      resetInMs: 1000,
    });

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.status).toBe('exhausted');
    expect(body.githubApi).toBe('ok');
  });

  it('returns degraded when quota is low', async () => {
    vi.mocked(quotaMonitor.getAggregateQuota).mockReturnValue({
      totalTokens: 1,
      activeTokens: 1,
      aggregateLimit: 5000,
      aggregateRemaining: 200,
      lowestRemainingPercent: 5,
      totalRefreshes: 0,
    });

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.status).toBe('degraded');
    expect(body.githubApi).toBe('ok');
  });
});
