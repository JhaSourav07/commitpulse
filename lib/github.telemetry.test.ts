import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCircuitTelemetry,
  fetchWithRetry,
  clearGitHubApiCacheForTests,
  getTokenStatsForTests,
} from './github';

describe('GitHub Circuit Breaker Telemetry', () => {
  const originalGitHubPat = process.env.GITHUB_PAT;
  const originalGitHubToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    clearGitHubApiCacheForTests();
  });

  afterEach(() => {
    process.env.GITHUB_PAT = originalGitHubPat;
    process.env.GITHUB_TOKEN = originalGitHubToken;
  });

  it('reports closed circuit by default', () => {
    const telemetry = getCircuitTelemetry();
    expect(telemetry.isOpen).toBe(false);
    expect(telemetry.resetInMs).toBe(0);
  });

  it('reports open circuit with reset time when all tokens are exhausted', async () => {
    process.env.GITHUB_PAT = 'token1,token2';
    delete process.env.GITHUB_TOKEN;

    const resetTime1 = Date.now() + 5000;
    const resetTime2 = Date.now() + 10000;

    const tokenStats = getTokenStatsForTests();
    tokenStats.set('token1', { remaining: 0, resetTime: resetTime1 });
    tokenStats.set('token2', { remaining: 0, resetTime: resetTime2 });

    await expect(fetchWithRetry('https://api.github.com/graphql', { headers: {} })).rejects.toThrow(
      'API Rate Limit Exceeded'
    );

    const telemetry = getCircuitTelemetry();
    expect(telemetry.isOpen).toBe(true);
    expect(telemetry.resetInMs).toBeGreaterThan(0);
    // Should be based on the earliest reset time (resetTime1)
    expect(telemetry.resetInMs).toBeLessThanOrEqual(5000);
  });
});
