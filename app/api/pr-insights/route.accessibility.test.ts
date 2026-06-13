import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

describe('PR Insights Route Accessibility', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a human-readable error when username is missing so assistive technologies can announce the problem', async () => {
    const request = new Request('http://localhost/api/pr-insights');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('Username is required');

    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error.trim().length).toBeGreaterThan(0);
  });

  it('returns valid parseable JSON responses so assistive clients can reliably interpret state', async () => {
    const mockData = [{ id: 1, title: 'PR 1' }];

    vi.mocked(fetchPRInsights).mockResolvedValue(mockData as never);

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    const text = await response.text();

    expect(() => JSON.parse(text)).not.toThrow();

    const contentType = response.headers.get('content-type') || '';

    expect(contentType.toLowerCase()).toContain('application/json');
    expect(response.status).toBe(200);
  });

  it('communicates service failures using descriptive plain-language text instead of technical output', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error('Service failed'));

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('Service failed');

    expect(body.error).not.toMatch(/^\d+$/);
    expect(body.error).not.toContain('undefined');
    expect(body.error.trim().length).toBeGreaterThan(0);
  });

  it('returns a safe fallback message for unknown thrown values without leaking implementation details', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue('unknown');

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch PR insights');

    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error).not.toMatch(/at\s+\w+\s+\(/);
  });

  it('produces safe text-only error output that does not inject markup into consuming interfaces', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error('Internal failure'));

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(typeof body.error).toBe('string');

    expect(body.error).not.toMatch(/<script/i);
    expect(body.error).not.toMatch(/<\/?[a-z][\s\S]*>/i);

    expect(body.error.trim().length).toBeGreaterThan(0);
  });
});
