import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrgDashboardData } from '../../../lib/github';

const fetchMock = vi.fn();

vi.mock('node:fs', () => {
  return {
    existsSync: () => true,
    readFileSync: () => JSON.stringify({ ignored_authors: ['custom-bot-account'] }),
    default: {
      existsSync: () => true,
      readFileSync: () => JSON.stringify({ ignored_authors: ['custom-bot-account'] }),
    },
  };
});

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Organization Dashboard Bot Filtering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = fetchMock;
  });

  it('correctly filters out bot members and Custom Ignored Authors in getOrgDashboardData when excludeBots is true', async () => {
    // 1. Mock fetchUserProfile
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        login: 'my-org',
        type: 'Organization',
        public_repos: 5,
        followers: 10,
        following: 2,
        bio: 'Open Source Org',
        location: 'Earth',
        html_url: 'https://github.com/my-org',
      })
    );

    // 2. Mock fetchUserRepos
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    // 3. Mock fetchOrgMembers
    fetchMock.mockResolvedValueOnce(
      mockResponse([
        { login: 'human-developer' },
        { login: 'dependabot[bot]' },
        { login: 'custom-bot-account' },
      ])
    );

    // 4. Mock fetchGitHubContributions for human-developer (the only one that should be called)
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 100,
                weeks: [
                  {
                    contributionDays: [
                      { contributionCount: 5, date: '2024-01-01', color: 'green' },
                    ],
                  },
                ],
              },
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    const data = await getOrgDashboardData('my-org', {
      bypassCache: true,
      excludeBots: true,
    });

    expect(data.stats.totalContributions).toBe(100);
    expect(data.individualCalendars!.length).toBe(1);
    expect(data.individualCalendars![0].user).toBe('human-developer');
  });

  it('includes bot members when excludeBots is false', async () => {
    // 1. Mock fetchUserProfile
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        login: 'my-org',
        type: 'Organization',
        public_repos: 5,
        followers: 10,
        following: 2,
        bio: 'Open Source Org',
        location: 'Earth',
        html_url: 'https://github.com/my-org',
      })
    );

    // 2. Mock fetchUserRepos
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    // 3. Mock fetchOrgMembers
    fetchMock.mockResolvedValueOnce(
      mockResponse([
        { login: 'human-developer' },
        { login: 'dependabot[bot]' },
        { login: 'custom-bot-account' },
      ])
    );

    // 4. Mock fetchGitHubContributions for human-developer, dependabot[bot], and custom-bot-account
    for (let i = 0; i < 3; i++) {
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          data: {
            user: {
              contributionsCollection: {
                contributionCalendar: {
                  totalContributions: 100,
                  weeks: [
                    {
                      contributionDays: [
                        { contributionCount: 5, date: '2024-01-01', color: 'green' },
                      ],
                    },
                  ],
                },
                commitContributionsByRepository: [],
              },
            },
          },
        })
      );
    }

    const data = await getOrgDashboardData('my-org', {
      bypassCache: true,
      excludeBots: false,
    });

    expect(data.stats.totalContributions).toBe(300);
    expect(data.individualCalendars!.length).toBe(3);
  });
});
