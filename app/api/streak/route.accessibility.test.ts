import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(() => 3600),
  getSecondsUntilMidnightInTimezone: vi.fn(() => 7200),
}));

import { fetchGitHubContributions } from '../../../lib/github';

const mockCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [{ contributionCount: 1, date: '2024-06-10' }],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/streak');

  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  return new Request(url.toString());
}

describe('ApiStreakRoute SVG output', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as never);
  });

  it('contains SVG title metadata', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    const body = await response.text();

    expect(body).toContain('<title>');
    expect(body).toContain('Stats for');
  });

  it('contains a valid SVG root element', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    const body = await response.text();

    expect(body).toContain('<svg');
    expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('returns a valid SVG document', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');

    const body = await response.text();

    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });

  it('preserves title information when hide_title is false', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        hide_title: 'false',
      })
    );

    const body = await response.text();

    expect(body).toContain('OCTOCAT');
  });

  it('returns well formed SVG markup with title metadata', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    const body = await response.text();

    expect(body).toContain('<title>');
    expect(body).toContain('</svg>');
  });
});
