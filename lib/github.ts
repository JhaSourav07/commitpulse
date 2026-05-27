// lib/github.ts

import type { ContributionCalendar, ContributionDay } from '../types';
import { calculateStreak } from './calculate';
import { TTLCache } from './cache';
import { LANGUAGE_COLORS } from './svg/languageColors';

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

// Maximum number of attempts (initial + retries).
const MAX_RETRIES = 3;
// Initial delay in ms; doubles on each retry.
const BASE_DELAY_MS = 500;
const CONTRIBUTION_MILESTONES = [1, 10, 100, 250, 500, 1000];
const STREAK_MILESTONES = [3, 7, 30, 100];
const GRAPHQL_TIMEOUT_MS = 8000; // 8s for GraphQL endpoint
const REST_TIMEOUT_MS = 5000; // 5s for REST endpoints

// Retry delay uses exponential backoff: delay = BASE_DELAY_MS * 2^attempt.
export async function fetchWithRetry(
  url: string | URL,
  options: RequestInit,
  attempt = 0,
  timeoutMs?: number
): Promise<Response> {
  // Determine default timeout based on endpoint type if not explicitly provided.
  // GraphQL calls carry a larger payload and need a slightly longer window.
  const resolvedTimeout =
    timeoutMs ?? (url.toString().includes('graphql') ? GRAPHQL_TIMEOUT_MS : REST_TIMEOUT_MS);

  if (options.signal?.aborted) {
    throw new Error('AbortError');
  }

  // Each retry attempt gets a fresh AbortController so the timeout window
  // resets per attempt — not cumulative across the entire retry chain.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), resolvedTimeout);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let res: Response | null = null;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);

    // If the caller aborted, rethrow immediately without retrying
    if (options.signal?.aborted) {
      throw err;
    }

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

/**
 * Configuration options for GitHub API fetch requests.
 */
type FetchOptions = {
  /**
   * Skips the in-memory cache and forces a fresh GitHub API request.
   */
  bypassCache?: boolean;

  /**
   * Start date used for filtering contribution data.
   * Expected format: YYYY-MM-DD.
   */
  from?: string;

  /**
   * End date used for filtering contribution data.
   * Expected format: YYYY-MM-DD.
   */
  to?: string;

  /**
   * Optional AbortSignal used to cancel the request.
   */
  signal?: AbortSignal;
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

// Named constants to avoid magic numbers and allow future tuning
const MAX_CONTRIBUTIONS_CACHE_SIZE = 1000;
const MAX_PROFILE_CACHE_SIZE = 1000;
const MAX_REPOS_CACHE_SIZE = 500;

// Bounded capacity controls to prevent unbounded heap memory leaks (OOM).
// Under continuous crawler/bot scanning or viral peaks, unbounded cache size
// allocations will exhaust Node/Vercel serverless RAM.
// Specifying explicit capacity limits enforces a First-In, First-Out (FIFO)
// eviction strategy (since standard ES6 Map maintains key insertion order) and
// bounds max memory consumption to stable, predictable boundaries.
const contributionsCache = new TTLCache<ContributionCalendar>(MAX_CONTRIBUTIONS_CACHE_SIZE);
const profileCache = new TTLCache<GitHubUserProfile>(MAX_PROFILE_CACHE_SIZE);
const reposCache = new TTLCache<GitHubRepo[]>(MAX_REPOS_CACHE_SIZE);

export function cacheKey(
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

/**
 * Fetches a user's GitHub contribution calendar using the GitHub GraphQL API.
 *
 * Requests are automatically retried on rate limiting (429) and server errors (5xx)
 * using exponential backoff.
 *
 * @param username - GitHub username to fetch contributions for.
 * @param options - Optional fetch configuration.
 * @param options.bypassCache - Forces a fresh API request instead of using cached data.
 * @param options.from - Start date for contribution filtering.
 * @param options.to - End date for contribution filtering.
 * @param options.signal - Optional AbortSignal used to cancel the request.
 *
 * @returns A promise resolving to the user's contribution calendar.
 *
 * @throws {Error} If the GitHub PAT is missing or invalid.
 * @throws {Error} If the GitHub user cannot be found.
 * @throws {Error} If the GitHub API request fails after all retry attempts.
 * @throws {Error} If the request times out or is aborted.
 *
 * @example
 * ```ts
 * const calendar = await fetchGitHubContributions("octocat", {
 *   from: "2025-01-01",
 *   to: "2025-12-31",
 *   bypassCache: true,
 * });
 * ```
 */
export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ContributionCalendar> {
  if (!validateGitHubUsername(username)) {
    console.warn(
      `[GitHub API] Username "${username}" does not match standard GitHub format. Attempting fetch anyway.`
    );
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
    signal: options.signal,
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('GitHub PAT is invalid or missing');
    throw new Error(
      `GitHub GraphQL API returned status ${res.status} after ${MAX_RETRIES} retries`
    );
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

/**
 * Fetches public GitHub profile information for a user.
 *
 * Requests are automatically retried on rate limiting (429) and server errors (5xx)
 * using exponential backoff.
 *
 * @param username - GitHub username to fetch profile data for.
 * @param options - Optional fetch configuration.
 * @param options.bypassCache - Forces a fresh API request instead of using cached data.
 * @param options.signal - Optional AbortSignal used to cancel the request.
 *
 * @returns A promise resolving to the user's GitHub profile data.
 *
 * @throws {Error} If the GitHub user cannot be found.
 * @throws {Error} If the GitHub REST API request fails.
 * @throws {Error} If the request times out or is aborted.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 *
 * const profile = await fetchUserProfile("octocat", {
 *   signal: controller.signal,
 * });
 * ```
 */
export async function fetchUserProfile(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubUserProfile> {
  if (!validateGitHubUsername(username)) {
    console.warn(
      `[GitHub API] Username "${username}" does not match standard GitHub format. Attempting fetch anyway.`
    );
  }

  const key = cacheKey('profile', username);

  if (!options.bypassCache) {
    const cached = profileCache.get(key);
    if (cached) return cached;
  }

  const res = await fetchWithRetry(`${GITHUB_REST_URL}/users/${username}`, {
    headers: getHeaders(),
    cache: 'no-store',
    signal: options.signal,
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

/**
 * Fetches public repositories for a GitHub user.
 *
 * Repository data is fetched from the GitHub REST API with automatic retries
 * for rate limiting (429) and server errors (5xx).
 *
 * Results are paginated with a maximum limit of 300 repositories
 * across 3 API pages.
 *
 * @param username - GitHub username to fetch repositories for.
 * @param options - Optional fetch configuration.
 * @param options.bypassCache - Forces a fresh API request instead of using cached data.
 * @param options.signal - Optional AbortSignal used to cancel the request.
 *
 * @returns A promise resolving to an array of GitHub repositories.
 *
 * @throws {Error} If the GitHub API request fails after all retry attempts.
 * @throws {Error} If the request times out or is aborted.
 *
 * @example
 * ```ts
 * const repos = await fetchUserRepos("octocat");
 *
 * console.log(repos.length);
 * ```
 */
export async function fetchUserRepos(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubRepo[]> {
  if (!validateGitHubUsername(username)) {
    console.warn(
      `[GitHub API] Username "${username}" does not match standard GitHub format. Attempting fetch anyway.`
    );
  }

  const key = cacheKey('repos', username);

  if (!options.bypassCache) {
    const cached = reposCache.get(key);
    if (cached) return cached;
  }
  const allRepos: GitHubRepo[] = [];

  let PAGE = 1;
  const MAX_PAGES = 3; // Hard cap at 3 pages (300 repos) to prevent API rate limit exhaustion (DoS)
  while (PAGE <= MAX_PAGES) {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&page=${PAGE}&sort=pushed`,
      {
        headers: getHeaders(),
        cache: 'no-store',
        signal: options.signal,
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

export function buildCommitClock(allDays: ContributionDay[]) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = new Array(7).fill(0);

  for (const day of allDays) {
    const dow = new Date(day.date).getUTCDay();
    dayTotals[dow] += day.contributionCount;
  }

  return dayNames.map((name, i) => ({
    day: name,
    commits: dayTotals[i],
  }));
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
  if (!validateGitHubUsername(username)) {
    console.warn(
      `[GitHub API] Username "${username}" does not match standard GitHub format. Attempting fetch anyway.`
    );
  }

  const [profileResult, reposResult, calendarResult] = await Promise.allSettled([
    fetchUserProfile(username, options),
    fetchUserRepos(username, options),
    fetchGitHubContributions(username, options),
  ]);

  if (profileResult.status === 'rejected') {
    throw new Error(`[GitHub API] Failed to fetch profile for user "${username}"`, {
      cause: profileResult.reason,
    });
  }
  const profileData = profileResult.value;

  const reposData = reposResult.status === 'fulfilled' ? reposResult.value : [];

  if (reposResult.status === 'rejected' && process.env.NODE_ENV === 'development') {
    console.error(
      `[GitHub API] Failed to fetch repos for user "${username}" (fallback to empty list):`,
      reposResult.reason
    );
  }

  const calendarData =
    calendarResult.status === 'fulfilled'
      ? calendarResult.value
      : ({ totalContributions: 0, weeks: [] } as ContributionCalendar);
  if (calendarResult.status === 'rejected' && process.env.NODE_ENV === 'development') {
    console.error(
      `[GitHub API] Failed to fetch calendar for user "${username}" (fallback to 0 contributions):`,
      calendarResult.reason
    );
  }

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

  const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalLangs) * 100),
      color: LANGUAGE_COLORS[name] || '#a855f7', // fallback purple
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
  const commitClock = buildCommitClock(allDays);

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
}
