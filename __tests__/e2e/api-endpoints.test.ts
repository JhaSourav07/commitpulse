/**
 * E2E / Integration tests for SVG API endpoints.
 *
 * These tests call route handlers directly but focus on verifying response
 * properties that unit tests typically miss: HTTP headers, Content-Type,
 * SVG well-formedness, cache directives, and CSP headers.
 *
 * External dependencies (GitHub API, MongoDB) are mocked at the network
 * boundary so the full request→validation→compute→render pipeline runs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContributionCalendar, ExtendedContributionData } from '../../types';

// ─── Shared mock data ──────────────────────────────────────────────────────

const mockCalendar: ContributionCalendar = {
  totalContributions: 42,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2024-06-10' },
        { contributionCount: 3, date: '2024-06-11' },
        { contributionCount: 0, date: '2024-06-12' },
        { contributionCount: 7, date: '2024-06-13' },
        { contributionCount: 4, date: '2024-06-14' },
        { contributionCount: 8, date: '2024-06-15' },
        { contributionCount: 2, date: '2024-06-16' },
      ],
    },
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-17' },
        { contributionCount: 1, date: '2024-06-18' },
        { contributionCount: 6, date: '2024-06-19' },
        { contributionCount: 2, date: '2024-06-20' },
        { contributionCount: 1, date: '2024-06-21' },
        { contributionCount: 0, date: '2024-06-22' },
        { contributionCount: 0, date: '2024-06-23' },
      ],
    },
  ],
};

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn().mockReturnValue(3600),
  getSecondsUntilMidnightInTimezone: vi.fn().mockReturnValue(7200),
}));

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/Notification', () => ({
  Notification: { findOneAndUpdate: vi.fn(), findOne: vi.fn() },
}));
vi.mock('@/models/User', () => ({
  User: { updateOne: vi.fn() },
}));
vi.mock('@/lib/rate-limit', () => ({
  trackUserRateLimiter: { check: vi.fn().mockResolvedValue(true) },
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 60,
    remaining: 59,
    reset: Date.now() + 60000,
  }),
}));

import { fetchGitHubContributions, getFullDashboardData } from '@/lib/github';
import { GET as streakGET } from '@/app/api/streak/route';
import { GET as statsGET } from '@/app/api/stats/route';
import { GET as compareGET } from '@/app/api/compare/route';

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchGitHubContributions).mockResolvedValue({
    calendar: mockCalendar,
    repoContributions: [],
  } as unknown as ExtendedContributionData);
  vi.mocked(getFullDashboardData).mockResolvedValue({
    calendar: mockCalendar,
    stats: { totalCommits: 42 },
  } as never);
});

// ─── /api/streak ────────────────────────────────────────────────────────────

describe('E2E: /api/streak', () => {
  it('returns image/svg+xml Content-Type for valid requests', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('returns Content-Security-Policy header', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'none'");
  });

  it('returns Cache-Control header with s-maxage', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    const cc = res.headers.get('Cache-Control');
    expect(cc).toContain('s-maxage=');
    expect(cc).toContain('stale-while-revalidate');
  });

  it('returns no-cache Cache-Control when refresh=true', async () => {
    const res = await streakGET(
      new Request('http://localhost/api/streak?user=octocat&refresh=true')
    );
    expect(res.headers.get('Cache-Control')).toContain('no-cache');
  });

  it('returns X-Cache-Status header', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    expect(res.headers.get('X-Cache-Status')).toBeTruthy();
  });

  it('returns well-formed SVG output', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    const body = await res.text();
    expect(body.trimStart()).toMatch(/^<svg[\s>]/);
    expect(body).toContain('</svg>');
    expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('returns 400 with JSON Content-Type for invalid parameters', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak'));
    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('returns valid SVG for all view types', async () => {
    const views = ['default', 'monthly', 'heatmap', 'pulse'];
    for (const view of views) {
      const res = await streakGET(
        new Request(`http://localhost/api/streak?user=octocat&view=${view}`)
      );
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('</svg>');
    }
  });
});

// ─── /api/stats ─────────────────────────────────────────────────────────────

describe('E2E: /api/stats', () => {
  it('returns application/json Content-Type', async () => {
    const res = await statsGET(new Request('http://localhost/api/stats?user=octocat'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('returns streak statistics in the response body', async () => {
    const res = await statsGET(new Request('http://localhost/api/stats?user=octocat'));
    const data = await res.json();
    expect(data.totalContributions).toBeDefined();
    expect(data.currentStreak).toBeDefined();
    expect(data.longestStreak).toBeDefined();
  });

  it('returns Cache-Control header', async () => {
    const res = await statsGET(new Request('http://localhost/api/stats?user=octocat'));
    expect(res.headers.get('Cache-Control')).toBeTruthy();
  });

  it('returns 400 when user parameter is missing', async () => {
    const res = await statsGET(new Request('http://localhost/api/stats'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid GitHub username', async () => {
    const res = await statsGET(new Request('http://localhost/api/stats?user=-invalid'));
    expect(res.status).toBe(400);
  });
});

// ─── /api/compare ───────────────────────────────────────────────────────────

describe('E2E: /api/compare', () => {
  it('returns application/json Content-Type for valid requests', async () => {
    const res = await compareGET(new Request('http://localhost/api/compare?user1=alice&user2=bob'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('returns data for both users', async () => {
    const res = await compareGET(new Request('http://localhost/api/compare?user1=alice&user2=bob'));
    const data = await res.json();
    expect(data.user1).toBeDefined();
    expect(data.user2).toBeDefined();
  });

  it('returns 400 when parameters are missing', async () => {
    const res = await compareGET(new Request('http://localhost/api/compare'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for self-comparison', async () => {
    const res = await compareGET(
      new Request('http://localhost/api/compare?user1=octocat&user2=octocat')
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when a user is not found', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Not found'));
    const res = await compareGET(
      new Request('http://localhost/api/compare?user1=ghost&user2=octocat')
    );
    expect(res.status).toBe(404);
  });
});

// ─── Cross-endpoint consistency ─────────────────────────────────────────────

describe('E2E: Cross-endpoint consistency', () => {
  it('all SVG endpoints include xmlns attribute', async () => {
    const res = await streakGET(new Request('http://localhost/api/streak?user=octocat'));
    const body = await res.text();
    expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('validation errors use consistent JSON structure across endpoints', async () => {
    const streakRes = await streakGET(new Request('http://localhost/api/streak'));
    const statsRes = await statsGET(new Request('http://localhost/api/stats'));

    const streakBody = await streakRes.json();
    const statsBody = await statsRes.json();

    // Both should have error and details fields
    expect(streakBody.error).toBeDefined();
    expect(streakBody.details).toBeDefined();
    expect(statsBody.error).toBeDefined();
    expect(statsBody.details).toBeDefined();
  });
});
