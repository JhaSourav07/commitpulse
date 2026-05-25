// lib/github.ts

import type { ContributionCalendar } from '../types';
import { calculateStreak } from './calculate';
import { TTLCache } from './cache';

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const CONTRIBUTION_MILESTONES = [1, 10, 100, 250, 500, 1000];
const STREAK_MILESTONES = [3, 7, 30, 100];
const GRAPHQL_TIMEOUT_MS = 8000; // 8s for GraphQL endpoint
const REST_TIMEOUT_MS = 5000; // 5s for REST endpoints

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt = 0,
  timeoutMs?: number
): Promise<Response> {
  // Determine default timeout based on endpoint type if not explicitly provided.
  // GraphQL calls carry a larger payload and need a slightly longer window.
  const resolvedTimeout =
    timeoutMs ?? (url.includes('graphql') ? GRAPHQL_TIMEOUT_MS : REST_TIMEOUT_MS);

  // Each retry attempt gets a fresh AbortController so the timeout window
  // resets per attempt — not cumulative across the entire retry chain.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), resolvedTimeout);

  let res: Response | null = null;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortError means the timeout fired — throw a clear typed message.
    if (err instanceof Error && err.name === 'AbortError') {
      const seconds = resolvedTimeout / 1000;
      throw new Error(`GitHub API request timed out after ${seconds}s`);
    }
    // Network error — retry if attempts remain, otherwise rethrow
    if (attempt >= MAX_RETRIES) throw err;
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, attempt + 1, timeoutMs);
  }

  clearTimeout(timeoutId);

  // Only retry on 429 or 5xx — all other statuses are returned immediately
  const shouldRetry = res.status === 429 || res.status >= 500;
  if (!shouldRetry || attempt >= MAX_RETRIES) return res;

  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchWithRetry(url, options, attempt + 1, timeoutMs);
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
  from?: string;
  to?: string;
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

function cacheKey(
  kind: 'contributions' | 'profile' | 'repos',
  username: string,
  year?: string
): string {
  return year ? `${kind}:${username.toLowerCase()}:${year}` : `${kind}:${username.toLowerCase()}`;
}

export function clearGitHubApiCacheForTests(): void {
  contributionsCache.clear();
  profileCache.clear();
  reposCache.clear();
}

const getHeaders = () => ({
  Authorization: `bearer ${process.env.GITHUB_PAT || process.env.GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
});

export function validateGitHubUsername(username: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
}

export function displayName(profile: GitHubUserProfile): string {
  if (typeof profile.name === 'string' && profile.name.trim() !== '') {
    return profile.name;
  }
  return profile.login;
}

export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ContributionCalendar> {
  if (!validateGitHubUsername(username)) {
    throw new Error('Invalid GitHub username format');
  }

  const key = cacheKey('contributions', username, options.from?.substring(0, 4));

  if (!options.bypassCache) {
    const cached = contributionsCache.get(key);
    if (cached) return cached;
  }

  const query = `
    query($login: String!, $from: DateTime, $to: DateTime) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
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

  const res = await fetchWithRetry(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query,
      variables: { login: username, from: options.from, to: options.to },
    }),
    cache: 'no-store', // Cache handled by our in-memory layer + API route headers
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('GitHub PAT is invalid or missing');
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
  if (!validateGitHubUsername(username)) {
    throw new Error('Invalid GitHub username format');
  }

  const key = cacheKey('profile', username);

  if (!options.bypassCache) {
    const cached = profileCache.get(key);
    if (cached) return cached;
  }

  const res = await fetchWithRetry(`${GITHUB_REST_URL}/users/${username}`, {
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
  if (!validateGitHubUsername(username)) {
    throw new Error('Invalid GitHub username format');
  }

  const key = cacheKey('repos', username);

  if (!options.bypassCache) {
    const cached = reposCache.get(key);
    if (cached) return cached;
  }
  const allRepos: GitHubRepo[] = [];

  let PAGE = 1;
  const MAX_PAGES = 100;
  while (PAGE <= MAX_PAGES) {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&page=${PAGE}&sort=pushed`,
      {
        headers: getHeaders(),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub REST API error: ${res.status}`);
    }

    const repos = (await res.json()) as GitHubRepo[];

    allRepos.push(...repos);

    if (repos.length < 100) {
      break;
    }

    PAGE++;
  }

  if (!options.bypassCache) {
    reposCache.set(key, allRepos, GITHUB_CACHE_TTL_MS);
  }

  return allRepos;
}

export function generateAchievements(totalContributions: number, currentStreak: number) {
  const achievements = [];

  // Contribution milestones
  for (const threshold of CONTRIBUTION_MILESTONES) {
    achievements.push({
      id: `contrib-${threshold}`,
      title:
        threshold === 1
          ? 'First Contribution'
          : threshold === 10
            ? 'Contributor'
            : `${threshold} Contributions`,
      description: `Reached ${threshold} total contributions`,
      icon: '🏆',
      isUnlocked: totalContributions >= threshold,
      type: 'contributions' as const,
      threshold,
      currentValue: totalContributions,
      progress: Math.min(100, Math.round((totalContributions / threshold) * 100)),
    });
  }

  // Streak milestones
  for (const threshold of STREAK_MILESTONES) {
    achievements.push({
      id: `streak-${threshold}`,
      title: threshold === 3 ? 'Getting Started' : `${threshold} Day Streak`,
      description:
        threshold === 3
          ? 'Maintained a 3-day coding streak'
          : `Maintained a ${threshold}-day coding streak`,
      icon: '🔥',
      isUnlocked: currentStreak >= threshold,
      type: 'streak' as const,
      threshold,
      currentValue: currentStreak,
      progress: Math.min(100, Math.round((currentStreak / threshold) * 100)),
    });
  }

  return achievements;
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
  if (!validateGitHubUsername(username)) {
    throw new Error('Invalid GitHub username format');
  }
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
      name: displayName(profileData),
      avatarUrl: profileData.avatar_url,
      isPro: profileData.plan?.name === 'pro',
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

      C: '#555555',
      'C#': '#178600',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Dart: '#00B4AB',
      Lua: '#000080',
      R: '#198CE7',
      Scala: '#c22d40',
      Perl: '#0298c3',
      Haskell: '#5e5086',
      Elixir: '#6e4a7e',
      Vue: '#41b883',
      Svelte: '#ff3e00',
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

    const achievements = generateAchievements(
      streakStats.totalContributions,
      streakStats.currentStreak
    );

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
    ];

    if (streakStats.currentStreak > 3) {
      insights.push({
        id: '3',
        icon: 'Zap',
        text: `You are currently on an active ${streakStats.currentStreak}-day streak! Keep it going!`,
      });
    } else {
      insights.push({
        id: '3',
        icon: 'Star',
        text: `Your longest coding streak is ${streakStats.longestStreak} days!`,
      });
    }

    // Aggregate real contribution data by day of week from the already-fetched calendar
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals = new Array(7).fill(0);
    for (const day of allDays) {
      const dow = new Date(day.date).getUTCDay();
      dayTotals[dow] += day.contributionCount;
    }
    const commitClock = dayNames.map((name, i) => ({
      day: name,
      commits: dayTotals[i],
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
      achievements,
      commitClock,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred');
  }
}
