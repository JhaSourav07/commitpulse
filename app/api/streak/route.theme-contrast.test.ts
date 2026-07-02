import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions, getOrgDashboardData } from '../../../lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';

const mockCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' },
        { contributionCount: 2, date: '2024-06-11' },
        { contributionCount: 3, date: '2024-06-12' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/streak');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new Request(url.toString());
}

describe('GET /api/streak theme contrast', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as never);

    vi.mocked(getOrgDashboardData).mockResolvedValue({
      calendar: mockCalendar,
    } as never);

    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  it('renders successfully with dark theme', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'dark',
      })
    );

    expect(response.status).toBe(200);

    const body = await response.text();

    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });

  it('renders successfully with light theme', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'light',
      })
    );

    expect(response.status).toBe(200);

    const body = await response.text();

    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });

  it('produces different SVG output for dark and light themes', async () => {
    const darkResponse = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'dark',
      })
    );

    const lightResponse = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'light',
      })
    );

    const darkSvg = await darkResponse.text();
    const lightSvg = await lightResponse.text();

    expect(darkSvg).not.toEqual(lightSvg);
  });

  it('uses prefers-color-scheme CSS when theme=auto', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'auto',
      })
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('prefers-color-scheme: dark');
  });

  it('includes CSS variables for automatic theme switching', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        theme: 'auto',
      })
    );

    const body = await response.text();

    expect(body).toContain('--cp-bg');
  });
});
