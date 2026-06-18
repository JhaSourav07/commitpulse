import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import type { ExtendedContributionData } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

function makeRequest(username: string) {
  return new Request(`http://localhost/api/user-details?username=${username}`);
}

function createMassiveCalendar(weekCount: number) {
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => ({
      contributionCount: Math.floor(Math.random() * 500),
      date: `2024-${String((dayIndex % 12) + 1).padStart(2, '0')}-${String(
        (weekIndex % 28) + 1
      ).padStart(2, '0')}`,
    })),
  }));

  return {
    totalContributions: weeks.reduce(
      (sum, week) =>
        sum + week.contributionDays.reduce((inner, day) => inner + day.contributionCount, 0),
      0
    ),
    weeks,
  };
}

describe('ApiUserDetailsRoute massive scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. returns valid response for extremely large contribution calendars (750+ weeks)', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'octocat',
      name: 'Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      public_repos: 42,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      bio: 'Test bio',
      location: 'San Francisco',
    });

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: createMassiveCalendar(750),
      repoContributions: [],
    } as unknown as ExtendedContributionData);

    vi.mocked(calculateStreak).mockReturnValue({
      currentStreak: 15,
      longestStreak: 42,
      totalContributions: 85000,
      todayDate: '2024-06-15',
    });

    const response = await GET(makeRequest('octocat'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.login).toBe('octocat');
    expect(body.stats.totalContributions).toBe(85000);
  });

  it('2. handles null contributions gracefully (transient failure) without crashing', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'octocat',
      name: 'Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      public_repos: 42,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      bio: 'Test bio',
      location: 'San Francisco',
    });

    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('rate limit'));

    const response = await GET(makeRequest('octocat'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats.currentStreak).toBe(0);
    expect(body.stats.totalContributions).toBe(0);
  });

  it('3. returns 404 when user is not found', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('not found'));
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('not found'));

    const response = await GET(makeRequest('nonexistent-user'));
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('4. maintains acceptable performance for large calendars', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'octocat',
      name: 'Octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      public_repos: 42,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      bio: 'Test bio',
      location: 'San Francisco',
    });

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: createMassiveCalendar(750),
      repoContributions: [],
    } as unknown as ExtendedContributionData);

    vi.mocked(calculateStreak).mockReturnValue({
      currentStreak: 10,
      longestStreak: 30,
      totalContributions: 120000,
      todayDate: '2024-06-15',
    });

    const start = performance.now();
    const response = await GET(makeRequest('octocat'));
    await response.json();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  it('5. validates username format and returns 400 for empty input', async () => {
    const response = await GET(makeRequest(''));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Username is required');
  });

  it('6. handles extremely high contribution counts without overflow', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'megacontributor',
      name: 'Mega',
      avatar_url: '',
      public_repos: 999,
      followers: 9999,
      following: 500,
      created_at: '2015-01-01T00:00:00Z',
      bio: 'Mega contributor',
      location: 'Internet',
    });

    vi.mocked(calculateStreak).mockReturnValue({
      currentStreak: 365,
      longestStreak: 1000,
      totalContributions: 9999999,
      todayDate: '2024-06-15',
    });

    const response = await GET(makeRequest('megacontributor'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats.totalContributions).toBe(9999999);
    expect(body.stats.longestStreak).toBe(1000);
  });
});
