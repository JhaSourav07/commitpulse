// lib/github.ts

import type { ContributionCalendar } from '../types';
import { calculateStreak } from './calculate';
import { TTLCache } from './cache';

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_REST_URL = 'https://api.github.com';

type GitHubContributionResponse = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
};

type FetchOptions = {
  bypassCache?: boolean;
};

export const GITHUB_CACHE_TTL_MS = 5 * 60 * 1000;

interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  bio: string | null;
  location: string | null;
  plan?: { name?: string } | null;
}

const contributionsCache = new TTLCache<ContributionCalendar>();
const profileCache = new TTLCache<GitHubUserProfile>();
const reposCache = new TTLCache<GitHubRepo[]>();

function cacheKey(kind: 'contributions' | 'profile' | 'repos', username: string): string {
  return `${kind}:${username.toLowerCase()}`;
}

export function clearGitHubApiCacheForTests(): void {
  contributionsCache.clear();
  profileCache.clear();
  reposCache.clear();
}

const getHeaders = (includeContentType = false): Record<string, string> => {
  const token = process.env.GITHUB_TOKEN;
  const headers: {
    Authorization?: string;
    Accept: string;
    'Content-Type'?: string;
  } = {
    Authorization: token ? `Bearer ${token}` : undefined,
    Accept: 'application/vnd.github+json',
  };

  if (!headers.Authorization) {
    delete headers.Authorization;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

function createFallbackContributionCalendar(): ContributionCalendar {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days = Array.from({ length: 371 }, (_, idx) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (370 - idx));
    return {
      contributionCount: 0,
      date: date.toISOString().slice(0, 10),
      color: '#ebedf0',
    };
  });

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => ({
    contributionDays: days.slice(weekIndex * 7, weekIndex * 7 + 7),
  }));

  return {
    totalContributions: 0,
    weeks,
  };
}

export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ContributionCalendar> {
  const key = cacheKey('contributions', username);

  if (!options.bypassCache) {
    const cached = contributionsCache.get(key);
    if (cached) return cached;
  }

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ query, variables: { login: username } }),
    cache: 'no-store', // Cache handled by our in-memory layer + API route headers
  });

  if (!res.ok) {
    if (res.status === 401 && !process.env.GITHUB_TOKEN) {
      const fallbackCalendar = createFallbackContributionCalendar();
      if (!options.bypassCache) {
        contributionsCache.set(key, fallbackCalendar, GITHUB_CACHE_TTL_MS);
      }
      return fallbackCalendar;
    }
    throw new Error(`GitHub GraphQL API returned status ${res.status}`);
  }

  const data: GitHubContributionResponse = await res.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  if (!data.data.user) {
    throw new Error(`GitHub user "${username}" not found`);
  }

  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  if (!options.bypassCache) {
    contributionsCache.set(key, calendar, GITHUB_CACHE_TTL_MS);
  }

  return calendar;
}

export async function fetchUserProfile(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubUserProfile> {
  const key = cacheKey('profile', username);

  if (!options.bypassCache) {
    const cached = profileCache.get(key);
    if (cached) return cached;
  }

  const res = await fetch(`${GITHUB_REST_URL}/users/${username}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  const profile = (await res.json()) as GitHubUserProfile;

  if (!options.bypassCache) {
    profileCache.set(key, profile, GITHUB_CACHE_TTL_MS);
  }

  return profile;
}

export async function fetchUserRepos(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubRepo[]> {
  const key = cacheKey('repos', username);

  if (!options.bypassCache) {
    const cached = reposCache.get(key);
    if (cached) return cached;
  }

  const res = await fetch(`${GITHUB_REST_URL}/users/${username}/repos?per_page=100&sort=pushed`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  const repos = (await res.json()) as GitHubRepo[];

  if (!options.bypassCache) {
    reposCache.set(key, repos, GITHUB_CACHE_TTL_MS);
  }

  return repos;
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
  try {
    const [profileData, reposData, calendarData] = await Promise.all([
      fetchUserProfile(username, options),
      fetchUserRepos(username, options),
      fetchGitHubContributions(username, options),
    ]);

    // Pre-compute streak + stars early so developerScore can use them
    const streakStats = calculateStreak(calendarData);
    const totalStars = reposData.reduce(
      (acc: number, repo: GitHubRepo) => acc + repo.stargazers_count,
      0
    );

    // Developer Score — 5-factor weighted formula (max 100 pts)
    // Repos:         up to 25 pts  (saturates at 50 public repos)
    // Followers:     up to 25 pts  (saturates at 50 followers)
    // Stars:         up to 20 pts  (saturates at 100 total stars)
    // Contributions: up to 20 pts  (saturates at 400 yearly contributions)
    // Streak:        up to 10 pts  (saturates at a 50-day longest streak)
    const developerScore = Math.min(
      Math.round(
        Math.min(profileData.public_repos * 0.5, 25) +
          Math.min(profileData.followers * 0.5, 25) +
          Math.min(totalStars * 0.2, 20) +
          Math.min(streakStats.totalContributions / 20, 20) +
          Math.min(streakStats.longestStreak * 0.2, 10)
      ),
      100
    );

    // 1. Profile Mapping
    const profile = {
      username: profileData.login,
      name: profileData.name || profileData.login,
      avatarUrl: profileData.avatar_url,
      isPro: profileData.plan?.name === 'pro' || profileData.public_repos > 50,
      bio: profileData.bio || 'No bio available',
      location: profileData.location || 'Earth',
      joinedDate: new Date(profileData.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      developerScore,
      stats: {
        repositories: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        stars: totalStars,
      },
    };

    // 2. Streaks & Activity Mapping (streakStats already computed above)

    // Flatten days for charts
    const allDays = calendarData.weeks.flatMap((w) => w.contributionDays);
    const activity = allDays.map((day) => {
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (day.contributionCount > 0) intensity = 1;
      if (day.contributionCount > 3) intensity = 2;
      if (day.contributionCount > 6) intensity = 3;
      if (day.contributionCount > 10) intensity = 4;

      return {
        date: day.date,
        count: day.contributionCount,
        intensity,
      };
    });

    // 3. Languages Mapping
    const langCounts: Record<string, number> = {};
    reposData.forEach((repo: GitHubRepo) => {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    });

    // Fixed color mapping for common languages to avoid random colors
    const languageColors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Go: '#00ADD8',
      Rust: '#dea584',
    };

    const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0);
    const languages = Object.entries(langCounts)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalLangs) * 100),
        color: languageColors[name] || '#a855f7', // fallback purple
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5); // top 5

    // 4. Insights Generation
    const insights = [
      {
        id: '1',
        icon: 'Flame',
        text: `You have a total of ${streakStats.totalContributions} contributions this year.`,
      },
      {
        id: '2',
        icon: 'Code',
        text: `Your primary language is ${languages[0]?.name || 'Unknown'}.`,
      },
      {
        id: '3',
        icon: 'Star',
        text: `Your longest coding streak is ${streakStats.longestStreak} days!`,
      },
    ];

    // Simulate 24h cycle (because GitHub events API is heavily rate limited to 300 events which doesn't give a full picture)
    const commitClock = Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      commits: Math.floor(Math.random() * 20) + (i >= 9 && i <= 17 ? 30 : 0), // working hours peak
    }));

    return {
      profile,
      stats: {
        currentStreak: streakStats.currentStreak,
        peakStreak: streakStats.longestStreak,
        totalContributions: streakStats.totalContributions,
      },
      languages,
      activity,
      insights,
      commitClock,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred');
  }
}
