import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchGitHubContributions } from '../../../lib/github';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(() => 3600),
  getSecondsUntilMidnightInTimezone: vi.fn(() => 7200),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/streak');
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });
  return new Request(url.toString());
}

describe('ApiStreakRoute - Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without breaking when calendar arrays are completely empty', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
      repoContributions: [],
    } as never);

    const response = await GET(makeRequest({ user: 'emptyuser' }));
    expect(response.status).toBe(200);
    const body = await response.text();

    // Check DOM structures / empty markers
    expect(body).toContain('<svg');
    expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('returns a fallback error response when required parameters are missing', async () => {
    const response = await GET(makeRequest({}));
    expect(response.status).toBe(400);

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
    } else {
      const body = await response.text();
      expect(body).toContain('<rect');
    }
  });

  it('maintains standard styles when weeks exist but contribution counts are zero', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [
          {
            contributionDays: [{ contributionCount: 0, date: '2024-01-01' }],
          },
        ],
      },
      repoContributions: [],
    } as never);

    const response = await GET(makeRequest({ user: 'zerouser' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
    expect(body).toContain('Stats for');
  });

  it('handles offline fallback state from GitHub fetcher gracefully', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
      repoContributions: [],
      isOfflineFallback: true,
    } as never);

    const response = await GET(makeRequest({ user: 'offlineuser' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('returns valid JSON with empty values when format=json and inputs are empty', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
      repoContributions: [],
    } as never);

    const response = await GET(makeRequest({ user: 'jsonuser', format: 'json' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');

    const body = await response.json();
    expect(body.user).toBe('jsonuser');
    expect(body.calendar.totalContributions).toBe(0);
    expect(body.calendar.weeks).toEqual([]);
  });
});
