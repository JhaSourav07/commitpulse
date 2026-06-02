import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '../../../lib/github';

vi.mock('../../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

function makeRequest(user1?: string, user2?: string): Request {
  const url = new URL('http://localhost/api/compare');
  if (user1) url.searchParams.set('user1', user1);
  if (user2) url.searchParams.set('user2', user2);
  return new Request(url.toString());
}

describe('compare API - githubFetch integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Successful Parallel Fetch (200): resolves both users', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({ totalContributions: 100 } as never);
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({ totalContributions: 200 } as never);

    const response = await GET(makeRequest('userA', 'userB'));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.user1.totalContributions).toBe(100);
    expect(data.user2.totalContributions).toBe(200);
    expect(getFullDashboardData).toHaveBeenCalledTimes(2);
  });

  it('User Not Found (404): correctly handles 404 rejection for user2', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({ totalContributions: 100 } as never);
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found in system'));

    const response = await GET(makeRequest('userA', 'userB'));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('Failed to fetch data for "userB"');
    expect(data.error).toContain('not found');
  });

  it('Rate Limit Handling (403): handles API rate limit exceptions gracefully', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('API limit reached for GitHub')
    );
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({ totalContributions: 200 } as never);

    const response = await GET(makeRequest('userA', 'userB'));
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('GitHub API rate limit reached');
  });

  it('Connection Timeout (500): safely catches unhandled timeouts', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({ totalContributions: 100 } as never);
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Connection timeout ETICK'));

    const response = await GET(makeRequest('userA', 'userB'));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Connection timeout');
  });

  it('Parallel Rejection Priority (Both Fail): prioritizes first user rejection in Promise.allSettled', async () => {
    // Both fail at the same time
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found'));
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('API limit reached'));

    const response = await GET(makeRequest('userA', 'userB'));
    // Since userA is checked first in allSettled, it should return 404 for userA
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('Failed to fetch data for "userA"');
    expect(data.error).toContain('not found');
  });
});
