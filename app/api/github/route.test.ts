import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
// Replace the real GitHub API with a fake function so tests can run without hitting real APIs
vi.mock('../../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

import { getFullDashboardData } from '../../../lib/github';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/github');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1 — missing username → 400
  it('returns 400 when username is missing', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid parameters');
  });

  it('returns 400 and skips GitHub when username format is invalid', async () => {
    const response = await GET(makeRequest({ username: 'bad user' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid parameters');
    expect(getFullDashboardData).not.toHaveBeenCalled();
  });

  // Test 2 — valid username → 200
  it('returns 200 with JSON body for a valid username', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({ profile: 'octocat' } as never);

    const response = await GET(makeRequest({ username: 'octocat' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ profile: 'octocat' });
  });

  // Test 3 — throws 'User not found' → 404
  it('returns 404 when getFullDashboardData throws User not found', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest({ username: 'octocat' }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  // Test 4 — throws 'API limit reached' → 403
  it('returns 403 when getFullDashboardData throws API limit reached', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('API limit reached'));

    const response = await GET(makeRequest({ username: 'octocat' }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('rate limit');
  });

  // Test 5 — throws generic error → 500
  it('returns 500 for a generic unexpected error', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('Something went wrong'));

    const response = await GET(makeRequest({ username: 'octocat' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Something went wrong');
  });
});
