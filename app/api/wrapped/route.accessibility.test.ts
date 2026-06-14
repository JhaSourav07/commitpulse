// app/api/wrapped/route.accessibility.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getWrappedData } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import type { WrappedStats } from '../../../types/dashboard';

vi.mock('../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
  getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 1420,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2025-11-19' },
        { contributionCount: 42, date: '2025-11-20' },
        { contributionCount: 12, date: '2025-11-21' },
      ],
    },
  ],
};

const mockWrappedStats: WrappedStats = {
  totalContributions: 1420,
  mostActiveDate: '2025-11-20',
  highestDailyCount: 42,
  busiestMonth: '2025-11',
  weekendRatio: 24,
  topLanguage: 'TypeScript',
  calendar: mockCalendar,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('ApiWrappedRoute Accessibility (WCAG / ARIA compliance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);
  });

  // Test 1: Plain Language Validation Errors (WCAG 3.3.1 Error Identification)
  it('1. returns descriptive plain-text JSON errors for invalid parameters without technical leaks', async () => {
    const response = await GET(makeRequest({ user: 'invalid_user--' }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.trim().length).toBeGreaterThan(0);
    // Must not leak raw JavaScript/TypeScript system values to screen reader users
    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
  });

  // Test 2: Descriptive plain-language SVG error messages (WCAG 3.3.1)
  it('2. renders descriptive SVG text for rate-limit (429) and not-found (404) states', async () => {
    // Rate limit SVG error
    vi.mocked(getWrappedData).mockRejectedValueOnce(new Error('API Rate Limit Exceeded'));
    const resRateLimit = await GET(makeRequest({ user: 'octocat' }));
    expect(resRateLimit.status).toBe(429);

    const rateLimitSvg = await resRateLimit.text();
    expect(rateLimitSvg).toContain('<svg');
    expect(rateLimitSvg).toContain('RATE LIMIT');

    // User not found SVG error
    vi.mocked(getWrappedData).mockRejectedValueOnce(new Error('User not found'));
    const resNotFound = await GET(makeRequest({ user: 'nonexistent' }));
    expect(resNotFound.status).toBe(404);

    const notFoundSvg = await resNotFound.text();
    expect(notFoundSvg).toContain('<svg');
    expect(notFoundSvg).toContain('NOT FOUND');
  });

  // Test 3: SVG Semantic ARIA Landmarks & Accessible Tags
  it('3. embeds role="img", aria-labelledby, and aria-describedby linked to matching title and desc tags in the SVG', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2025' }));
    expect(response.status).toBe(200);

    const svg = await response.text();

    // Find matching aria attributes and IDs
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="cp-title-octocat"');
    expect(svg).toContain('aria-describedby="cp-desc-octocat"');

    // Title tag verification
    expect(svg).toContain('<title id="cp-title-octocat">octocat\'s GitHub Wrapped 2025</title>');

    // Desc tag verification (contains stats summary for accessibility readers)
    expect(svg).toContain('<desc id="cp-desc-octocat">');
    expect(svg).toContain('1420 total contributions');
    expect(svg).toContain('top language is TypeScript');
  });

  // Test 4: Parsing Correctness & Content Types (WCAG 4.1.1 Parsing)
  it('4. returns correct content-type header format for valid SVGs and JSON errors', async () => {
    // Valid SVG response
    const resSuccess = await GET(makeRequest({ user: 'octocat' }));
    expect(resSuccess.headers.get('Content-Type')).toContain('image/svg+xml');

    // Validation JSON error
    const resFail = await GET(makeRequest({ user: '' }));
    expect(resFail.headers.get('Content-Type')).toContain('application/json');
  });

  // Test 5: Safe Character Escaping in Accessible Tags
  it('5. sanitizes user inputs inside SVG accessibility tags to prevent malformed XML or script injections', async () => {
    const maliciousStats = {
      ...mockWrappedStats,
      topLanguage: 'TypeScript<script>alert("xss")</script>',
    };
    vi.mocked(getWrappedData).mockResolvedValueOnce(maliciousStats);

    const response = await GET(makeRequest({ user: 'octocat' }));
    const svg = await response.text();

    // Verify script tags are escaped/removed and don't render raw elements
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('</script>');

    // Verifying it escapes XML-breaking characters
    expect(svg).toContain('TypeScript&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
