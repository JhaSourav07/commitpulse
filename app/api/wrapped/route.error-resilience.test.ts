import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/svg/generator', () => ({
  generateWrappedSVG: vi.fn(),
  generateNotFoundSVG: vi.fn().mockReturnValue('<svg>not found</svg>'),
  generateRateLimitSVG: vi.fn().mockReturnValue('<svg>rate limit</svg>'),
}));

// Import after mocks
import { GET } from './route';
import { getWrappedData, getCircuitTelemetry } from '../../../lib/github';
import { generateWrappedSVG } from '@/lib/svg/generator';
import logger from '@/lib/logger';
import type { WrappedStats } from '../../../types/dashboard';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/wrapped - Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. handles database/network connectivity errors gracefully without crashing, returning 500 with fallback SVG (Hydration Stability)', async () => {
    vi.mocked(getWrappedData).mockRejectedValue(
      new Error('Connection timed out to database instance')
    );

    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('Something went wrong. Please try again later.');
  });

  it('2. recovers gracefully and returns a 500 fallback SVG when the SVG generator throws a nested runtime exception (Exception Safety & Fallbacks)', async () => {
    vi.mocked(getWrappedData).mockResolvedValue({} as unknown as WrappedStats);
    vi.mocked(generateWrappedSVG).mockImplementation(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'weeks')");
    });

    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('Something went wrong. Please try again later.');
  });

  it('3. verifies that exceptions are logged to the dev-telemetry tracker appropriately (Telemetry Tracking)', async () => {
    const errorMsg = 'Unexpected database node failure';
    vi.mocked(getWrappedData).mockRejectedValue(new Error(errorMsg));

    await GET(makeRequest({ user: 'octocat' }));

    expect(logger.error).toHaveBeenCalledWith('Unhandled error', {
      source: 'wrapped',
      message: errorMsg,
    });
  });

  it('4. ensures user reset and reload paths/headers are available on rate limit and circuit breaker recovery panels (Interactive Recovery UI)', async () => {
    vi.mocked(getWrappedData).mockRejectedValue(new Error('API Rate Limit Exceeded'));
    vi.mocked(getCircuitTelemetry).mockReturnValue({ isOpen: true, resetInMs: 45000 });

    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-CommitPulse-Circuit-Status')).toBe('Open');
    expect(response.headers.get('X-CommitPulse-Circuit-Reset-In')).toBe('45000');
    const body = await response.text();
    expect(body).toContain('rate limit');
  });

  it('5. returns a properly sanitized XML fallback SVG when a validation exception occurs to ensure client-side parser stability (XML/Hydration Safety)', async () => {
    vi.mocked(getWrappedData).mockRejectedValue(
      new Error('Validation error: malformed input <script>alert(1)</script>')
    );

    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(400);
    const body = await response.text();
    expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body).not.toContain('<script>');
  });
});
