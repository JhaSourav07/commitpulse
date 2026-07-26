import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Ensure module mocks are declared before dynamic imports
vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));
vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

import { getFullDashboardData } from '@/lib/github';

type DashboardStub = {
  username?: string;
  score?: number;
  calendar?: { totalContributions?: number; weeks?: unknown[] };
  [k: string]: unknown;
};

let GET: (req: NextRequest) => Promise<Response>;

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/compare?${query}`);
}

describe('GET /api/compare comparisonStats focused tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import so mocks are applied before module evaluation
    const mod = await import('../route');
    // Route expects a Request-like object; NextRequest is compatible here
    GET = mod.GET as (req: NextRequest) => Promise<Response>;
  });

  it('returns 200 and JSON structure for valid dual-profile comparison', async () => {
    const alice: DashboardStub = {
      username: 'alice',
      score: 750,
      calendar: { totalContributions: 120, weeks: [] },
    };
    const bob: DashboardStub = {
      username: 'bob',
      score: 600,
      calendar: { totalContributions: 80, weeks: [] },
    };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(alice as never)
      .mockResolvedValueOnce(bob as never);

    const res = await GET(makeRequest('user1=alice&user2=bob'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('user1');
    expect(body).toHaveProperty('user2');
    expect(body.user1.username).toBe('alice');
    expect(body.user2.username).toBe('bob');
  });

  it('produces correct score spreads between profiles', async () => {
    const strong: DashboardStub = { username: 'strong', score: 900 };
    const weak: DashboardStub = { username: 'weak', score: 400 };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(strong as never)
      .mockResolvedValueOnce(weak as never);

    const res = await GET(makeRequest('user1=strong&user2=weak'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(typeof data.user1.score).toBe('number');
    expect(typeof data.user2.score).toBe('number');
    expect(data.user1.score).toBeGreaterThan(data.user2.score);
    expect(data.user1.score - data.user2.score).toBe(500);
  });

  it('handles missing profile metrics gracefully without throwing', async () => {
    const partial: DashboardStub = { username: 'partial' }; // missing score/calendar
    const full: DashboardStub = {
      username: 'full',
      score: 300,
      calendar: { totalContributions: 5, weeks: [] },
    };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(partial as never)
      .mockResolvedValueOnce(full as never);

    const res = await GET(makeRequest('user1=partial&user2=full'));
    expect(res.status).toBe(200);

    const data = await res.json();
    // missing fields should not crash the route; they may be undefined
    expect(data.user1).toBeDefined();
    expect(data.user2).toBeDefined();
  });

  it('returns 400 when a required user parameter is missing', async () => {
    const res = await GET(makeRequest('user1=onlyone'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('exposes JSON content type and sensible cache-control bounds when returning comparison JSON', async () => {
    const u1: DashboardStub = { username: 'u1', score: 100 };
    const u2: DashboardStub = { username: 'u2', score: 200 };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(u1 as never)
      .mockResolvedValueOnce(u2 as never);

    const res = await GET(makeRequest('user1=u1&user2=u2'));
    expect(res.status).toBe(200);

    expect(res.headers.get('Content-Type')).toBe('application/json');

    const cc = res.headers.get('Cache-Control');
    // Either absent (platform-managed) or within reasonable bounds (revalidate-like semantics)
    if (cc) {
      expect(cc).toMatch(/s-maxage=\d+|no-cache|no-store/);
    }
  });
});
