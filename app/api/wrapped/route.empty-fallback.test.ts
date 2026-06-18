import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { getWrappedData, getCircuitTelemetry } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),
  getCircuitTelemetry: vi.fn(() => ({ isOpen: false, resetInMs: 0 })),
}));

vi.mock('@/lib/svg/generator', () => ({
  generateWrappedSVG: vi.fn(() => '<svg>mock-wrapped</svg>'),
  generateNotFoundSVG: vi.fn(() => '<svg>mock-not-found</svg>'),
  generateRateLimitSVG: vi.fn(() => '<svg>mock-rate-limit</svg>'),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

describe('ApiWrappedRoute - Empty Fallback & Edge Cases Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');

    vi.spyOn(quotaMonitor, 'isQuotaLow').mockReturnValue(false);
    vi.spyOn(refreshRateLimiter, 'checkLimit').mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 0,
    });
    vi.spyOn(refreshPolicy, 'isRefreshAllowed').mockReturnValue(true);
    vi.spyOn(refreshPolicy, 'recordRefresh').mockImplementation(() => {});
  });

  it('handles empty query parameters, triggers validation parsing failure, and returns structured field errors', async () => {
    const dummyRequest = new Request('http://localhost:3000/api/wrapped');
    const response = await GET(dummyRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'Invalid parameters');
    expect(body).toHaveProperty('details');
  });

  it('intercepts cache bypass requests when the GitHub API quota is empty/low and throws a structured rate limit response', async () => {
    vi.spyOn(quotaMonitor, 'isQuotaLow').mockReturnValue(true);

    vi.mocked(getCircuitTelemetry).mockReturnValue({
      isOpen: true,
      resetInMs: 300000,
    });

    const dummyRequest = new Request('http://localhost:3000/api/wrapped?user=octocat&refresh=true');
    const response = await GET(dummyRequest);

    expect(response.status).toBe(429);
    expect(response.headers.get('X-CommitPulse-Circuit-Status')).toBe('Open');

    const svgContent = await response.text();
    expect(svgContent).toContain('mock-rate-limit');
  });

  it('blocks cache bypass cycles when the IP client endpoint exceeds the sliding rate thresholds', async () => {
    vi.spyOn(refreshRateLimiter, 'checkLimit').mockReturnValue({
      success: false,
      limit: 3,
      remaining: 0,
      reset: 600000,
    });

    const dummyRequest = new Request('http://localhost:3000/api/wrapped?user=octocat&refresh=true');
    const response = await GET(dummyRequest);

    expect(response.status).toBe(429);
    const svgContent = await response.text();
    expect(svgContent).toContain('mock-rate-limit');
  });

  it('maps unresolvable usernames or missing GitHub repository assets gracefully into custom 404 SVG maps', async () => {
    vi.mocked(getWrappedData).mockRejectedValue(new Error('Could not resolve octocat'));

    const dummyRequest = new Request('http://localhost:3000/api/wrapped?user=octocat');
    const response = await GET(dummyRequest);

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');

    const svgContent = await response.text();
    expect(svgContent).toContain('mock-not-found');
  });

  it('intercepts internal evaluation string validation errors and safely wraps them into a 400 SVG card response', async () => {
    vi.mocked(getWrappedData).mockRejectedValue(
      new Error('validation failed for missing contextual properties')
    );

    const dummyRequest = new Request('http://localhost:3000/api/wrapped?user=octocat');
    const response = await GET(dummyRequest);

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const svgContent = await response.text();
    expect(svgContent).toContain('svg');
  });
});
