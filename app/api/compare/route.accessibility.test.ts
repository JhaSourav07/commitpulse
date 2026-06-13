import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('Compare Route Accessibility', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns human-readable validation errors so assistive technologies can announce parameter problems', async () => {
    const request = new Request('http://localhost/api/compare?user1=octocat');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid parameters');

    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error.trim().length).toBeGreaterThan(0);

    expect(body.details).toBeDefined();
  });

  it('returns valid parseable JSON responses so assistive clients can reliably interpret state', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({ login: 'alice' } as never)
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const request = new Request('http://localhost/api/compare?user1=alice&user2=bob');

    const response = await GET(request);

    const text = await response.text();

    expect(() => JSON.parse(text)).not.toThrow();

    const contentType = response.headers.get('content-type') || '';

    expect(contentType.toLowerCase()).toContain('application/json');
    expect(response.status).toBe(200);
  });

  it('communicates missing GitHub users with descriptive plain-language text instead of technical output', async () => {
    vi.mocked(getFullDashboardData)
      .mockRejectedValueOnce(new Error('User not found'))
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const request = new Request('http://localhost/api/compare?user1=ghost-user&user2=bob');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(typeof body.error).toBe('string');

    expect(body.error).toContain('ghost-user');
    expect(body.error.toLowerCase()).toContain('not found');

    expect(body.error).not.toMatch(/^\d+$/);
    expect(body.error).not.toContain('undefined');
  });

  it('communicates rate-limit failures using readable text that assistive technologies can announce', async () => {
    vi.mocked(getFullDashboardData)
      .mockRejectedValueOnce(new Error('GitHub API rate limit reached'))
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const request = new Request('http://localhost/api/compare?user1=alice&user2=bob');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(typeof body.error).toBe('string');

    expect(body.error.toLowerCase()).toContain('rate limit');

    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error).not.toMatch(/at\s+\w+\s+\(/);
  });

  it('produces safe text-only error output that does not inject markup into consuming interfaces', async () => {
    vi.mocked(getFullDashboardData)
      .mockRejectedValueOnce(new Error('Unexpected upstream failure'))
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const request = new Request('http://localhost/api/compare?user1=alice&user2=bob');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(typeof body.error).toBe('string');

    expect(body.error).not.toMatch(/<script/i);
    expect(body.error).not.toMatch(/<\/?[a-z][\s\S]*>/i);

    expect(body.error.trim().length).toBeGreaterThan(0);
  });
});
