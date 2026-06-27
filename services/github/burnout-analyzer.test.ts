import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBurnoutAnalysis } from './burnout-analyzer';

// Mock global fetch
const fetchMock = vi.fn();

vi.mock('@/lib/github', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github')>('@/lib/github');
  return {
    ...actual,
    getGitHubTokens: () => ['mock-token'],
  };
});

describe('BurnoutAnalyzer Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Re-assign fetch mock before each test to prevent the vitest.setup.ts
    // afterEach guard from leaking guardedFetch into subsequent tests.
    global.fetch = fetchMock;
  });

  it('correctly calculates repository metrics, burnout risk levels, and inactivity alerts', async () => {
    // Mock contributor statistics data from GitHub API
    const mockStats = [
      {
        author: { login: 'key-dev', avatar_url: 'https://avatar/key-dev' },
        total: 100,
        weeks: Array.from({ length: 52 }, (_, i) => {
          // Last 12 weeks are index 40-51
          // Let's create a highly active developer with 10 commits per week (intense workload)
          const isLast12 = i >= 40;
          return {
            w: 1600000000 + i * 7 * 24 * 3600,
            a: isLast12 ? 800 : 100,
            d: 10,
            c: isLast12 ? 10 : 2,
          };
        }),
      },
      {
        author: { login: 'churn-dev', avatar_url: 'https://avatar/churn-dev' },
        total: 30,
        weeks: Array.from({ length: 52 }, (_, i) => {
          // Historically active (average 2 commits/week), but quiet in the last 3 weeks
          const isSilentPeriod = i >= 49;
          return {
            w: 1600000000 + i * 7 * 24 * 3600,
            a: isSilentPeriod ? 0 : 200,
            d: 10,
            c: isSilentPeriod ? 0 : 2,
          };
        }),
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
      headers: new Headers(),
    } as Response);

    const report = await fetchBurnoutAnalysis('owner', 'repo', { bypassCache: true });

    expect(report.repoName).toBe('owner/repo');
    expect(report.totalCommits).toBe(130);
    expect(report.totalContributors).toBe(2);

    // key-dev has 100/130 = 76.9% commits. Bus factor should be 1 (since 76.9% >= 70%)
    expect(report.busFactor).toBe(1);
    expect(report.dependencyRisk).toBe('High');

    // Check key-dev has High burnout risk due to 12 consecutive high intensity weeks
    const keyDevMetric = report.contributors.find((c) => c.username === 'key-dev');
    expect(keyDevMetric).toBeDefined();
    expect(keyDevMetric?.riskLevel).toBe('High');
    expect(keyDevMetric?.burnoutScore).toBeGreaterThan(70);

    // Check churn-dev has inactivity alerts triggered
    const churnAlert = report.inactivityAlerts.find((a) => a.username === 'churn-dev');
    expect(churnAlert).toBeDefined();
    expect(churnAlert?.weeksSilent).toBe(3);
    expect(churnAlert?.severity).toBe('Medium');
  });

  it('falls back to rules-based recommendations when Gemini returns malformed JSON', async () => {
    const mockStats = [
      {
        author: { login: 'dev', avatar_url: 'https://avatar/dev' },
        total: 10,
        weeks: Array.from({ length: 52 }, (_, i) => ({
          w: 1600000000 + i * 7 * 24 * 3600,
          a: 100,
          d: 10,
          c: 2,
        })),
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockStats,
      headers: new Headers(),
    } as Response);

    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'this is not valid json {{' }] } }],
      }),
      headers: new Headers(),
    } as Response);

    const report = await fetchBurnoutAnalysis('owner', 'repo', { bypassCache: true });
    expect(report).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);

    delete process.env.GEMINI_API_KEY;
  });
});
