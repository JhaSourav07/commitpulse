// app/api/github/route.accessibility.test.ts

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
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
import { quotaMonitor } from '@/services/github/quota-monitor';

describe('GitHub Route Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns human-readable error text for invalid query parameters so screen readers can announce the problem', async () => {
    // WCAG 3.3.1 (Error Identification) — errors must be communicated in plain readable text.
    const request = new Request('https://example.com/api/github?username=');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(body.error.trim().length).toBeGreaterThan(0);
    // Must not leak technical undefined/null tokens to assistive technology
    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
  });

  it('uses descriptive plain-language messages when GitHub user is not found instead of raw status codes', async () => {
    // WCAG 3.3.1 — error messages must be descriptive, not numeric codes alone.
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      Object.assign(new Error('User not found'), { status: 404 })
    );

    const request = new Request('https://example.com/api/github?username=ghost-user');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('User not found');
    // Message must not be a bare number or empty string
    expect(body.error).not.toMatch(/^\d+$/);
    expect(body.error.trim().length).toBeGreaterThan(0);
  });

  it('communicates rate-limit and quota errors in readable text without leaking internal details', async () => {
    // WCAG 3.3.1 — users (and screen readers) must understand WHY a request failed.
    vi.mocked(quotaMonitor.isQuotaLow).mockReturnValueOnce(true);

    const request = new Request('https://example.com/api/github?username=alice&refresh=true');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(typeof body.error).toBe('string');
    expect(body.error.toLowerCase()).toContain('quota');
    // Must not expose stack traces, file paths, or internal tokens
    expect(body.error).not.toMatch(/at\s+\w+\s+\(/);
    expect(body.error).not.toContain('node_modules');
    expect(body.error).not.toContain('undefined');
  });

  it('returns valid parseable JSON responses so assistive clients can reliably interpret state', async () => {
    // WCAG 4.1.1 (Parsing) — output must be well-formed so it can be consumed by any client.
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: { login: 'alice' },
      lastSyncedAt: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);

    const request = new Request('https://example.com/api/github?username=alice');
    const response = await GET(request);

    // Response must be valid JSON (no HTML error pages that break assistive parsers)
    const text = await response.text();
    expect(() => JSON.parse(text)).not.toThrow();

    // Content-Type must declare JSON so screen readers / a11y tools know how to handle it
    const contentType = response.headers.get('content-type') || '';
    expect(contentType.toLowerCase()).toContain('application/json');

    // Status code must be set (not undefined) so assistive clients announce state correctly
    expect(typeof response.status).toBe('number');
    expect(response.status).toBe(200);
  });

  it('produces safe error output that does not inject script or markup-breaking characters', async () => {
    // WCAG 4.1.1 — generated output must be safe for any UI layer rendering the message.
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      Object.assign(new Error('Internal failure'), { status: 500 })
    );

    const request = new Request('https://example.com/api/github?username=alice');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(typeof body.error).toBe('string');
    // Must not contain raw HTML/script tags that could break assistive rendering
    expect(body.error).not.toMatch(/<script/i);
    expect(body.error).not.toMatch(/<\/?[a-z][\s\S]*>/i);
    // Must remain meaningful text
    expect(body.error.trim().length).toBeGreaterThan(0);
  });
});
