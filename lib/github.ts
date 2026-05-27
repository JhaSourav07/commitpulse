// lib/github.ts

import type { ContributionCalendar, ContributionDay } from '@/types';
import { calculateStreak, aggregateCalendars, calculateWrappedStats } from '@/lib/calculate';
import { TTLCache } from '@/lib/cache';
import { LANGUAGE_COLORS } from '@/lib/svg/languageColors';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './svg/constants';

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const GRAPHQL_TIMEOUT_MS = 8000; // 8s for GraphQL endpoint
const REST_TIMEOUT_MS = 5000; // 5s for REST endpoints

export async function fetchWithRetry(
  url: string | URL,
  options: RequestInit,
  attempt = 0,
  timeoutMs?: number
): Promise<Response> {
  const resolvedTimeout =
    timeoutMs ?? (url.toString().includes('graphql') ? GRAPHQL_TIMEOUT_MS : REST_TIMEOUT_MS);

  if (options.signal?.aborted) throw new Error('AbortError');

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
    if (options.signal?.aborted) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`GitHub API request timed out after ${resolvedTimeout / 1000}s`);
    }
    if (attempt >= MAX_RETRIES) throw err;
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, attempt + 1, timeoutMs);
  }

  clearTimeout(timeoutId);
  const shouldRetry = res.status === 429 || res.status >= 500;
  if (!shouldRetry || attempt >= MAX_RETRIES) return res;

  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchWithRetry(url, options, attempt + 1, timeoutMs);
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_REST_URL = 'https://api.github.com';
type GitHubRateLimitInfo = {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
  resetAt: string | null;
};

function parseRateLimitHeader(value: string | null): number | null {
  if (!value) return null;

  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getGitHubRateLimitInfo(res: Response): GitHubRateLimitInfo {
  const limit = parseRateLimitHeader(res.headers.get('x-ratelimit-limit'));
  const remaining = parseRateLimitHeader(res.headers.get('x-ratelimit-remaining'));
  const reset = parseRateLimitHeader(res.headers.get('x-ratelimit-reset'));

  return {
    limit,
    remaining,
    reset,
    resetAt: reset ? new Date(reset * 1000).toISOString() : null,
  };
}

function createRateLimitError(res: Response): Error {
  const rateLimit = getGitHubRateLimitInfo(res);
  const resetMessage = rateLimit.resetAt ? ` Please try again after ${rateLimit.resetAt}.` : '';

  return new Error(
    `GitHub API rate limit exceeded.${resetMessage} Configure GITHUB_TOKEN to increase the request limit.`
  );
}

function throwIfRateLimited(res: Response): void {
  const rateLimit = getGitHubRateLimitInfo(res);

  if (res.status === 403 && rateLimit.remaining === 0) {
    throw createRateLimitError(res);
  }

  if (res.status === 429) {
    throw createRateLimitError(res);
  }
}

type GitHubContributionResponse = {
  data?: {
    user: { contributionsCollection: { contributionCalendar: ContributionCalendar } } | null;
  };
  errors?: unknown;
};

function getGraphQLErrorMessage(errors: unknown): string {
  if (!Array.isArray(errors)) return 'GitHub GraphQL API returned an unknown error';
  const firstError = errors[0];
  if (
    firstError &&
    typeof firstError === 'object' &&
    'message' in firstError &&
    typeof firstError.message === 'string'
  ) {
    return firstError.message;
  }
  return 'GitHub GraphQL API returned an unknown error';
}

type FetchOptions = {
  bypassCache?: boolean;
  from?: string;
  to?: string;
  signal?: AbortSignal;
};

export const GITHUB_CACHE_TTL_MS = 5 * 60 * 1000;

const contributionsCache = new TTLCache<ContributionCalendar>(1000);
const profileCache = new TTLCache<GitHubUserProfile>(1000);
const reposCache = new TTLCache<GitHubRepo[]>(500);

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
  type?: string; // e.g. "User" or "Organization"
  plan?: { name?: string } | null;
}

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

function getGitHubToken(): string {
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
  const MISSING_GITHUB_TOKEN_MESSAGE = 'GitHub token is missing. Set GITHUB_PAT or GITHUB_TOKEN.';
  if (!token || token.trim() === '') {
    throw new Error(MISSING_GITHUB_TOKEN_MESSAGE);
  }

  return token;
}

const getHeaders = () => ({
  Authorization: `bearer ${getGitHubToken()}`,
  'Content-Type': 'application/json',
});

export function validateGitHubUsername(username: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
}

export function displayName(profile: GitHubUserProfile): string {
  if (typeof profile.name === 'string' && profile.name.trim() !== '') return profile.name;
  return profile.login;
}

/* ==========================================================================
 * DATA FETCHING
 * ========================================================================== */

export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ContributionCalendar> {
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
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throwIfRateLimited(res);
    if (res.status === 401) throw new Error('GitHub PAT is invalid or missing');
    throw new Error(`GitHub GraphQL API returned status ${res.status}`);
  }

  const data: GitHubContributionResponse = await res.json();
  if (data.errors !== undefined) throw new Error(getGraphQLErrorMessage(data.errors));
  if (!data.data?.user) throw new Error(`GitHub user "${username}" not found`);

  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  // Inject deterministic Lines of Code (LoC) approximation
  // Since GitHub's contributionCalendar doesn't provide native LoC metrics,
  // we generate a consistent estimation based on the day's commit volume.
  calendar.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      if (day.contributionCount > 0) {
        let hash1 = 2166136261,
          hash2 = 2166136261;
        const seed1 = day.date + 'add',
          seed2 = day.date + 'del';
        for (let i = 0; i < seed1.length; i++) {
          hash1 ^= seed1.charCodeAt(i);
          hash1 = Math.imul(hash1, 16777619);
        }
        for (let i = 0; i < seed2.length; i++) {
          hash2 ^= seed2.charCodeAt(i);
          hash2 = Math.imul(hash2, 16777619);
        }
        const randAdd = (hash1 >>> 0) / 4294967296;
        const randDel = (hash2 >>> 0) / 4294967296;

        day.locAdditions = Math.floor(day.contributionCount * (25 + randAdd * 85));
        day.locDeletions = Math.floor(day.contributionCount * (5 + randDel * 35));
      } else {
        day.locAdditions = 0;
        day.locDeletions = 0;
      }
    });
  });

  if (!options.bypassCache) contributionsCache.set(key, calendar, GITHUB_CACHE_TTL_MS);

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

  const res = await fetchWithRetry(`${GITHUB_REST_URL}/users/${username}`, {
    headers: getHeaders(),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throwIfRateLimited(res);
    if (res.status === 404) throw new Error('User not found');
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  const profile = (await res.json()) as GitHubUserProfile;
  if (!options.bypassCache) profileCache.set(key, profile, GITHUB_CACHE_TTL_MS);
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

  const firstPageRes = await fetchWithRetry(
    `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&page=1&sort=pushed`,
    {
      headers: getHeaders(),
      cache: 'no-store',
      signal: options.signal,
    }
  );

  if (!firstPageRes.ok) {
    throwIfRateLimited(firstPageRes);
    throw new Error(`GitHub REST API error: ${firstPageRes.status}`);
  }

  const firstPageRepos = (await firstPageRes.json()) as GitHubRepo[];
  const allRepos: GitHubRepo[] = [...firstPageRepos];

  const MAX_PAGES = 3;

  if (firstPageRepos.length === 100) {
    const remainingPages = Array.from({ length: MAX_PAGES - 1 }, (_, i) => i + 2);

    const responses = await Promise.all(
      remainingPages.map((page) =>
        fetchWithRetry(
          `${GITHUB_REST_URL}/users/${username}/repos?per_page=100&page=${page}&sort=pushed`,
          {
            headers: getHeaders(),
            cache: 'no-store',
            signal: options.signal,
          }
        )
      )
    );

    const pagesRepos = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          throwIfRateLimited(response);
          throw new Error(`GitHub REST API error: ${response.status}`);
        }

        return (await response.json()) as GitHubRepo[];
      })
    );

    for (const repos of pagesRepos) {
      allRepos.push(...repos);
    }
  }

  if (!options.bypassCache) reposCache.set(key, allRepos, GITHUB_CACHE_TTL_MS);
  return allRepos;
}

/* ==========================================================================
 * ORG AGGREGATION & EPIC FEATURES
 * ========================================================================== */

/**
 * Fetches members of an organization. (Used for Org Dashboards).
 */
export async function fetchOrgMembers(orgName: string): Promise<string[]> {
  const res = await fetchWithRetry(`${GITHUB_REST_URL}/orgs/${orgName}/members?per_page=50`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch members for org ${orgName}`);
  const members = (await res.json()) as { login: string }[];
  return members.map((m) => m.login);
}

/**
 * Generates an aggregated Organization Mega-Dashboard.
 */
export async function getOrgDashboardData(orgName: string, options: FetchOptions = {}) {
  const [profileData, reposData, members] = await Promise.all([
    fetchUserProfile(orgName, options),
    fetchUserRepos(orgName, options),
    fetchOrgMembers(orgName),
  ]);

  if (profileData.type !== 'Organization') {
    throw new Error('This endpoint is strictly for organizations.');
  }

  // Fetch calendars for all members concurrently (Capped by member limit to avoid 429)
  const memberCalendarsPromises = members.map((member) =>
    fetchGitHubContributions(member, options).catch(() => null)
  );

  const calendars = (await Promise.all(memberCalendarsPromises)).filter(
    (c) => c !== null
  ) as ContributionCalendar[];

  // Create the Mega-City
  const aggregatedCalendar = aggregateCalendars(calendars);
  const streakStats = calculateStreak(aggregatedCalendar);

  // Mapping logic similar to user dashboards
  const profile = {
    username: profileData.login,
    name: displayName(profileData),
    avatarUrl: profileData.avatar_url,
    isPro: false,
    bio: profileData.bio || 'Open Source Organization',
    location: profileData.location || 'Global',
    joinedDate: new Date(profileData.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    developerScore: 100, // Orgs get a fixed score or a different formula
    stats: {
      repositories: profileData.public_repos,
      followers: profileData.followers,
      following: members.length, // Display members count here
      stars: reposData.reduce((acc, r) => acc + r.stargazers_count, 0),
    },
  };

  return {
    profile,
    stats: {
      currentStreak: streakStats.currentStreak,
      peakStreak: streakStats.longestStreak,
      totalContributions: streakStats.totalContributions,
    },
    calendar: aggregatedCalendar, // Can be passed to standard SVG renderer!
  };
}

/**
 * Fetches data specifically tailored for the end-of-year GitHub Wrapped infographic.
 */
export async function getWrappedData(username: string, year: string) {
  const options = {
    from: `${year}-01-01T00:00:00Z`,
    to: `${year}-12-31T23:59:59Z`,
    bypassCache: true,
  };
  const calendar = await fetchGitHubContributions(username, options);
  const repos = await fetchUserRepos(username, options);

  const wrappedStats = calculateWrappedStats(calendar);

  // Top languages specific to wrapped
  const langCounts: Record<string, number> = {};
  repos.forEach((r) => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  return {
    ...wrappedStats,
    topLanguage:
      Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a])[0] || 'Unknown',
  };
}

/* ==========================================================================
 * UTILS & EXPORTS
 * ========================================================================== */

export function generateAchievements(totalContributions: number, currentStreak: number) {
  const achievements = [];
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
type StreakStats = {
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
};

type Language = {
  name: string;
};

export function buildInsights(streakStats: StreakStats, languages: Language[]) {
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

  return insights;
}

export function buildCommitClock(allDays: ContributionDay[]) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = new Array(7).fill(0);
  for (const day of allDays) {
    const dow = new Date(day.date).getUTCDay();
    dayTotals[dow] += day.contributionCount;
  }
  return dayNames.map((name, i) => ({ day: name, commits: dayTotals[i] }));
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
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
  const calendarData =
    calendarResult.status === 'fulfilled'
      ? calendarResult.value
      : ({ totalContributions: 0, weeks: [] } as ContributionCalendar);

  const streakStats = calculateStreak(calendarData);
  const totalStars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);

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
      locAdditions: day.locAdditions,
      locDeletions: day.locDeletions,
    };
  });

  const langCounts: Record<string, number> = {};
  reposData.forEach((repo) => {
    if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
  });

  const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalLangs) * 100),
      color: LANGUAGE_COLORS[name] || '#a855f7',
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  const achievements = generateAchievements(
    streakStats.totalContributions,
    streakStats.currentStreak
  );

  // 4. Insights Generation
  const insights = buildInsights(streakStats, languages);

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
}
