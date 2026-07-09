// app/api/github/route.theme-contrast.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

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
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    })),
  },
}));

vi.mock('@/services/github/background-refresh', () => ({
  backgroundRefresh: {
    isStale: vi.fn(() => false),
    triggerRefresh: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

const STUB_DATA = {
  profile: { login: 'alice', name: 'Alice' },
  lastSyncedAt: new Date().toISOString(),
} as unknown as Awaited<ReturnType<typeof getFullDashboardData>>;

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark
        ? query === '(prefers-color-scheme: dark)'
        : query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('GitHub API Route — theme contrast', () => {
  it('dark-mode environment: GET returns 200 with parseable JSON the client can use for themed rendering', async () => {
    stubMatchMedia(true);
    vi.mocked(getFullDashboardData).mockResolvedValueOnce(STUB_DATA);

    const request = new Request('https://example.com/api/github?username=alice');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('profile');
  });

  it('light-mode environment: GET returns 200 with parseable JSON the client can use for themed rendering', async () => {
    stubMatchMedia(false);
    vi.mocked(getFullDashboardData).mockResolvedValueOnce(STUB_DATA);

    const request = new Request('https://example.com/api/github?username=alice');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('profile');
  });

  it('error response text carries no hardcoded colour tokens or CSS fragments that would disrupt client theme styles', async () => {
    const colorPattern = /#[0-9a-fA-F]{3,6}\b|color\s*:|background\s*:|rgba?\s*\(|<style/i;

    const errorCases: Array<{ url: string; setup?: () => void }> = [
      { url: 'https://example.com/api/github?username=' },
      {
        url: 'https://example.com/api/github?username=alice',
        setup: () => {
          vi.mocked(getFullDashboardData).mockRejectedValueOnce(
            Object.assign(new Error('User not found'), { status: 404 })
          );
        },
      },
      {
        url: 'https://example.com/api/github?username=alice',
        setup: () => {
          vi.mocked(getFullDashboardData).mockRejectedValueOnce(
            Object.assign(new Error('Forbidden'), { status: 403 })
          );
        },
      },
    ];

    for (const { url, setup } of errorCases) {
      setup?.();
      const response = await GET(new Request(url));
      const body = await response.json();
      expect(typeof body.error).toBe('string');
      expect(body.error).not.toMatch(colorPattern);
    }
  });

  it('error response is delivered as JSON not an HTML page, ensuring theme stylesheets are not bypassed', async () => {
    stubMatchMedia(true);
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Internal failure'));

    const request = new Request('https://example.com/api/github?username=alice');
    const response = await GET(request);

    expect(response.status).toBe(500);
    // Route must respond with JSON, not an HTML error page that ignores client theme styles.
    const contentType = response.headers.get('content-type') ?? '';
    expect(contentType.toLowerCase()).toContain('application/json');
    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error).not.toMatch(/^<!DOCTYPE/i);
    expect(body.error).not.toMatch(/^<html/i);
  });

  it('Cache-Control and X-Cache-Status headers are identical in dark-mode and light-mode environments', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue(STUB_DATA);

    stubMatchMedia(true);
    const darkResponse = await GET(new Request('https://example.com/api/github?username=alice'));

    stubMatchMedia(false);
    const lightResponse = await GET(new Request('https://example.com/api/github?username=alice'));

    expect(darkResponse.headers.get('Cache-Control')).toBe(
      lightResponse.headers.get('Cache-Control')
    );
    expect(darkResponse.headers.get('X-Cache-Status')).toBe(
      lightResponse.headers.get('X-Cache-Status')
    );
  });
});
