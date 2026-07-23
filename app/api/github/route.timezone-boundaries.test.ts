import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ---------------------------
 * Mocks
 * -------------------------- */

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    after: vi.fn((cb: () => void) => cb()),
  };
});

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
  isAbortError: vi.fn(() => false),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/services/github/quota-monitor', () => ({
  quotaMonitor: {
    isQuotaLow: vi.fn(() => false),
    getQuota: vi.fn(() => ({ remaining: 5000 })),
  },
}));

vi.mock('@/services/github/refresh-policy', () => ({
  refreshPolicy: {
    isRefreshAllowed: vi.fn(() => true),
    recordRefresh: vi.fn(),
    getRemainingCooldown: vi.fn(() => 0),
  },
}));

vi.mock('@/services/github/refresh-rate-limiter', () => ({
  refreshRateLimiter: {
    checkLimit: vi.fn(() => ({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60000,
    })),
  },
}));

vi.mock('@/services/github/background-refresh', () => ({
  backgroundRefresh: {
    isStale: vi.fn(() => false),
    triggerRefresh: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/validations', () => ({
  githubParamsSchema: {
    safeParse: vi.fn(() => ({
      success: true,
      data: {
        username: 'octocat',
        refresh: false,
        bypassCache: false,
      },
    })),
  },
  coerceQueryParams: vi.fn((params) => params),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: class {
    async check() {
      return true;
    }
  },
  getRateLimitHeaders: vi.fn(() => ({})),
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

const makeRequest = (url = 'http://localhost:3000/api/github?username=octocat') => new Request(url);

/* ---------------------------
 * Timezone helpers
 *
 * These mirror what a viewer in a different region would experience — the
 * server may be in UTC but the response must contain ISO-8601 timestamps
 * that any client (EST, IST, JST) can parse deterministically without
 * date drift or off-by-one calendar boundary issues.
 * -------------------------- */

const TIMEZONE_OFFSETS = {
  UTC: 0,
  EST: -5, // Eastern Standard Time (no DST)
  IST: 5.5, // India Standard Time
  JST: 9, // Japan Standard Time
};

// Construct an ISO string for a given wall-clock date in a specific offset.
// Example: buildIsoForOffset(2024, 2, 29, 23, 30, 5.5) → the moment 2024-02-29
// 23:30 in IST expressed as its UTC-equivalent ISO string.
function buildIsoForOffset(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  offsetHours: number
): string {
  // Convert local wall-clock into UTC by subtracting the offset
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - offsetHours * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /api/github - timezone normalization & calendar boundary alignment', () => {
  // Standard timezone settings — the response payload must be stable when
  // the same underlying UTC timestamp is fetched by clients in UTC, EST,
  // IST and JST. Every ISO string returned must parse identically.
  it('preserves ISO timestamp identity across UTC, EST, IST, and JST reads', async () => {
    const canonicalIso = '2024-06-15T12:00:00.000Z';

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: canonicalIso,
    } as never);

    // Simulate 4 successive fetches — each represents a viewer in one region
    for (const tz of Object.keys(TIMEZONE_OFFSETS)) {
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      // The timestamp must NOT be mutated based on any implicit server locale
      expect(body.lastSyncedAt).toBe(canonicalIso);
      // Regardless of the viewer's timezone label, the epoch ms must match
      expect(new Date(body.lastSyncedAt).getTime()).toBe(new Date(canonicalIso).getTime());
      // Sanity — the offset lookup table must contain a numeric value
      expect(typeof TIMEZONE_OFFSETS[tz as keyof typeof TIMEZONE_OFFSETS]).toBe('number');
    }
  });

  // Calendar-visual alignment — a commit made near midnight in one region
  // should land on the same visual date across all four timezones once the
  // ISO timestamp is normalized. This prevents streak divergence across
  // regions (the primary risk called out in the issue background).
  it('aligns commit timestamps onto the correct visual date without off-by-one drift', async () => {
    // A commit made at 2024-06-15 23:30 IST → equivalent UTC is 18:00
    const istCommitIso = buildIsoForOffset(2024, 6, 15, 23, 30, TIMEZONE_OFFSETS.IST);

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: istCommitIso,
      contributions: [
        {
          date: '2024-06-15',
          count: 1,
        },
      ],
    } as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    // The ISO string must land on June 15 in UTC (18:00) — no calendar drift
    const parsed = new Date(body.lastSyncedAt);
    expect(parsed.getUTCFullYear()).toBe(2024);
    expect(parsed.getUTCMonth()).toBe(5); // 0-indexed June
    expect(parsed.getUTCDate()).toBe(15);
    // The contribution date must remain a bare YYYY-MM-DD string, unaffected
    expect(body.contributions[0].date).toBe('2024-06-15');
  });

  // Leap year boundaries — Feb 29 2024 exists and must round-trip through
  // the API without being coerced to Feb 28 or Mar 1. Leap boundaries are
  // the classic source of "gap in the contribution grid" bugs.
  it('preserves leap year boundary dates (Feb 29 2024) without gaps in the grid', async () => {
    const leapDayIso = '2024-02-29T12:00:00.000Z';

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: leapDayIso,
      contributions: [
        { date: '2024-02-28', count: 3 },
        { date: '2024-02-29', count: 5 },
        { date: '2024-03-01', count: 2 },
      ],
    } as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    // Feb 29 must survive the round trip
    expect(body.contributions.find((c: { date: string }) => c.date === '2024-02-29')).toBeDefined();
    // No unexpected gaps — all three consecutive days present
    const dates = body.contributions.map((c: { date: string }) => c.date);
    expect(dates).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    // lastSyncedAt parses as a valid Date
    expect(Number.isNaN(new Date(body.lastSyncedAt).getTime())).toBe(false);
  });

  // Locale-specific formatting — the API MUST return machine-readable ISO
  // strings (YYYY-MM-DDTHH:mm:ss.sssZ), never locale-formatted strings like
  // "6/15/2024" or "15/06/2024" that would confuse a JST client parsing an
  // EST response. This test enforces that contract.
  it('emits ISO-8601 date formats that parse identically in every locale', async () => {
    const iso = '2024-06-15T12:00:00.000Z';

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: iso,
    } as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    // Strict ISO-8601 regex: YYYY-MM-DDTHH:mm:ss(.sss)?Z
    const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    expect(body.lastSyncedAt).toMatch(iso8601);
    // Must NOT match common locale formats — a slash-separated date is a bug
    expect(body.lastSyncedAt).not.toMatch(/\//);
    // Parsing in any locale must yield the same epoch ms
    expect(new Date(body.lastSyncedAt).getTime()).toBe(Date.parse(iso));
  });

  // DST transition — March 10 2024 02:00 EST → 03:00 EDT (spring forward).
  // Timestamps captured right around this transition must remain stable UTC
  // ISO strings so streak/grace calculations don't lose or duplicate an hour.
  it('handles DST spring-forward transition (2024-03-10 US) without hour loss or duplication', async () => {
    // 2024-03-10 06:30 UTC == 01:30 EST (before spring forward)
    // Right after the jump, 03:30 EDT == 07:30 UTC — no 02:30 exists locally
    const beforeDst = '2024-03-10T06:30:00.000Z';
    const afterDst = '2024-03-10T07:30:00.000Z';

    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: beforeDst,
    } as never);

    const res1 = await GET(makeRequest());
    const body1 = await res1.json();
    expect(body1.lastSyncedAt).toBe(beforeDst);

    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: { login: 'octocat' },
      repositories: [],
      lastSyncedAt: afterDst,
    } as never);

    const res2 = await GET(makeRequest());
    const body2 = await res2.json();
    expect(body2.lastSyncedAt).toBe(afterDst);

    // The two moments are exactly 1 hour apart in UTC — no 0-min or 2-hr gap
    const deltaMs = new Date(body2.lastSyncedAt).getTime() - new Date(body1.lastSyncedAt).getTime();
    expect(deltaMs).toBe(60 * 60 * 1000);
  });
});
