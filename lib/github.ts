import type {
  ContributionCalendar,
  ContributionDay,
  ExtendedContributionData,
  RepoContribution,
  ContributionWeek,
  GraphNode,
  GraphLink,
} from '@/types';
import { calculateStreak, aggregateCalendars } from '@/lib/calculate';
import { DistributedCache } from '@/lib/cache';
import { LANGUAGE_COLORS } from '@/lib/svg/languageColors';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './svg/constants';

interface GitHubRepo {
  name: string;
  stargazers_count: number;
  language: string | null;
  fork?: boolean;
  forks_count?: number;
  updated_at?: string;
  owner?: { login: string };
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 5000;
const GRAPHQL_TIMEOUT_MS = 8000; // 8s for GraphQL endpoint
const REST_TIMEOUT_MS = 5000; // 5s for REST endpoints

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

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
  const abortRequest = () => controller.abort();

  if (options.signal) {
    options.signal.addEventListener('abort', abortRequest, { once: true });
  }

  let res: Response | null = null;
  let fetchError: unknown;
  let didThrow = false;

  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    fetchError = err;
    didThrow = true;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortRequest);
  }

  if (didThrow) {
    if (options.signal?.aborted) throw fetchError;
    const isTimeoutAbort = isAbortError(fetchError);
    if (attempt >= MAX_RETRIES) {
      if (isTimeoutAbort) {
        throw new Error(`GitHub API request timed out after ${resolvedTimeout / 1000}s`);
      }
      throw fetchError;
    }
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, attempt + 1, timeoutMs);
  }

  if (!res) throw new Error('GitHub API request failed without a response');

  // Check for rate limit headers
  const retryAfter = res.headers.get('retry-after');
  const isRateLimited =
    res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0');

  if (isRateLimited) {
    if (attempt >= MAX_RETRIES) return res;

    let delay = BASE_DELAY_MS * Math.pow(2, attempt);
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!Number.isNaN(parsed) && String(parsed) === retryAfter) {
        delay = parsed * 1000;
      } else {
        const dateDelay = Date.parse(retryAfter) - Date.now();
        if (!Number.isNaN(dateDelay) && dateDelay > 0) {
          delay = dateDelay;
        }
      }
    }

    // Clamp between exponential default and maximum safe delay before we early exit anyway
    delay = Math.max(BASE_DELAY_MS, delay);

    // If the delay is too long (e.g., > 5 seconds), it's a hard limit.
    // Return immediately to avoid serverless function timeouts.
    if (delay > MAX_RETRY_DELAY_MS) {
      return res;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, attempt + 1, timeoutMs);
  }

  // Only retry on 5xx — all other statuses are returned immediately
  const shouldRetry = res.status >= 500;
  if (!shouldRetry || attempt >= MAX_RETRIES) return res;

  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchWithRetry(url, options, attempt + 1, timeoutMs);
}

// Wraps fetchWithRetry to also retry on GraphQL-level RATE_LIMITED errors
// that GitHub returns with HTTP 200 OK instead of 429.
async function fetchGraphQLWithRetry(
  url: string | URL,
  options: RequestInit,
  attempt = 0,
  timeoutMs?: number
): Promise<Response> {
  const res = await fetchWithRetry(url, options, attempt, timeoutMs);
  if (!res.ok || attempt >= MAX_RETRIES) return res;

  const body: unknown = await res
    .clone()
    .json()
    .catch(() => null);
  const isBodyRateLimited =
    Array.isArray((body as { errors?: unknown })?.errors) &&
    (body as { errors: unknown[] }).errors.some(
      (e) =>
        (e as { type?: string })?.type === 'RATE_LIMITED' ||
        (e as { message?: string })?.message?.toLowerCase().includes('rate limit')
    );

  if (!isBodyRateLimited) return res;

  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  if (delay > MAX_RETRY_DELAY_MS) return res;

  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchGraphQLWithRetry(url, options, attempt + 1, timeoutMs);
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

interface GitHubGraphQLResponse {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
        commitContributionsByRepository: RepoContribution[];
      };
    } | null;
  };
  errors?: unknown;
}

function getGraphQLErrorMessage(errors: unknown): string {
  if (!Array.isArray(errors)) return 'GitHub GraphQL API returned an unknown error';
  const firstError = errors[0];
  if (
    firstError !== null &&
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

const contributionsCache = new DistributedCache<ExtendedContributionData>(1000);
const profileCache = new DistributedCache<GitHubUserProfile>(1000);
const reposCache = new DistributedCache<GitHubRepo[]>(500);
const pendingContributions = new Map<string, Promise<ExtendedContributionData>>();
const pendingProfiles = new Map<string, Promise<GitHubUserProfile>>();
const pendingRepos = new Map<string, Promise<GitHubRepo[]>>();

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
): string;
export function cacheKey(
  kind: 'contributions' | 'profile' | 'repos',
  username: string,
  from?: string,
  to?: string
): string;
export function cacheKey(
  kind: 'contributions' | 'profile' | 'repos',
  username: string,
  yearOrFrom?: string,
  to?: string
): string {
  if (yearOrFrom && to) {
    return `${kind}:${username.toLowerCase()}:${yearOrFrom.substring(0, 10)}:${to.substring(0, 10)}`;
  }
  return yearOrFrom
    ? `${kind}:${username.toLowerCase()}:${yearOrFrom.substring(0, 4)}`
    : `${kind}:${username.toLowerCase()}`;
}

export function clearGitHubApiCacheForTests(): void {
  contributionsCache.clear();
  profileCache.clear();
  reposCache.clear();
  pendingContributions.clear();
  pendingProfiles.clear();
  pendingRepos.clear();
}

function dedupeRequest<T>(
  pendingRequests: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = load().finally(() => {
    pendingRequests.delete(key);
  });
  pendingRequests.set(key, request);
  return request;
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

function mergeCalendars(
  oldCal: ContributionCalendar,
  newCal: ContributionCalendar
): ContributionCalendar {
  const dayMap = new Map<string, ContributionDay>();

  for (const week of oldCal.weeks) {
    for (const day of week.contributionDays) {
      dayMap.set(day.date, day);
    }
  }

  for (const week of newCal.weeks) {
    for (const day of week.contributionDays) {
      dayMap.set(day.date, day);
    }
  }

  const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const mergedWeeks: ContributionWeek[] = [];
  let currentWeek: ContributionWeek = { contributionDays: [] };

  for (const day of sortedDays) {
    const dateObj = new Date(day.date);
    if (currentWeek.contributionDays.length > 0 && dateObj.getUTCDay() === 0) {
      mergedWeeks.push(currentWeek);
      currentWeek = { contributionDays: [] };
    }
    currentWeek.contributionDays.push(day);
  }
  if (currentWeek.contributionDays.length > 0) {
    mergedWeeks.push(currentWeek);
  }

  const total = sortedDays.reduce((sum, d) => sum + d.contributionCount, 0);

  return {
    totalContributions: total,
    weeks: mergedWeeks,
  };
}

export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ExtendedContributionData> {
  const key = cacheKey('contributions', username, options.from, options.to);

  if (options.bypassCache) {
    return fetchContributionsUncached(username, key, options, null);
  }

  // Wrap the entire cache-check + fetch pipeline in dedupeRequest so that
  // concurrent calls for the same key share a single in-flight promise.
  // This closes the TOCTOU window where two requests both miss the cache
  // (during the async DistributedCache.get) and each fires its own API call.
  const load = async (): Promise<ExtendedContributionData> => {
    const cached = await contributionsCache.get(key);

    const now = Date.now();
    const isStale = cached?.calendar.lastSyncedAt
      ? now - new Date(cached.calendar.lastSyncedAt).getTime() > GITHUB_CACHE_TTL_MS
      : true;

    if (cached && !isStale) {
      return cached;
    }

    return fetchContributionsUncached(username, key, options, cached);
  };

  return dedupeRequest(pendingContributions, key, load);
}

async function fetchContributionsUncached(
  username: string,
  key: string,
  options: FetchOptions,
  cached: ExtendedContributionData | null
): Promise<ExtendedContributionData> {
  const isDeltaSync = cached && cached.calendar.lastSyncedAt && !options.bypassCache;
  let queryFrom = options.from;

  if (isDeltaSync) {
    const lastSyncedDate = new Date(cached.calendar.lastSyncedAt!);
    lastSyncedDate.setUTCDate(lastSyncedDate.getUTCDate() - 1);
    queryFrom = lastSyncedDate.toISOString();
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
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                primaryLanguage {
                  name
                }
              }
              contributions {
                totalCount
              }
            }
          }
        }
      }
    `;

  const res = await fetchGraphQLWithRetry(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query,
      variables: { login: username, from: queryFrom, to: options.to },
    }),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throwIfRateLimited(res);
    if (res.status === 401) throw new Error('GitHub PAT is invalid or missing');
    throw new Error(
      `GitHub GraphQL API returned status ${res.status} after ${MAX_RETRIES} retries`
    );
  }

  const data: GitHubGraphQLResponse = await res.json();

  if (data.errors !== undefined) {
    if (Array.isArray(data.errors)) {
      const isRateLimit = data.errors.some(
        (e) =>
          e?.message?.toLowerCase().includes('rate limit') ||
          (e as { type?: string })?.type === 'RATE_LIMITED'
      );
      if (isRateLimit) {
        throw new Error('API Rate Limit Exceeded');
      }
    }
    throw new Error(getGraphQLErrorMessage(data.errors));
  }

  if (!data.data?.user) {
    throw new Error(`GitHub user "${username}" not found`);
  }

  let calendar = data.data.user.contributionsCollection?.contributionCalendar;
  const repoContributions =
    data.data.user.contributionsCollection?.commitContributionsByRepository || [];

  if (!calendar || !calendar.weeks) {
    calendar = {
      totalContributions: 0,
      weeks: [],
    };
  }

  if (isDeltaSync && cached) {
    calendar = mergeCalendars(cached.calendar, calendar);
  }

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

  calendar.lastSyncedAt = new Date().toISOString();

  // Cache for 7 days to enable delta syncs, staleness is handled logically
  const LONG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  if (!options.bypassCache) {
    await contributionsCache.set(
      key,
      {
        calendar,
        repoContributions,
      },
      LONG_CACHE_TTL
    );
  }
  return {
    calendar,
    repoContributions,
  };
}

export async function fetchUserProfile(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubUserProfile> {
  const key = cacheKey('profile', username);
  const encodedUsername = encodeURIComponent(username);

  if (options.bypassCache) {
    return fetchProfileUncached(encodedUsername, key, options);
  }

  const load = async (): Promise<GitHubUserProfile> => {
    const cached = await profileCache.get(key);
    if (cached) return cached;
    return fetchProfileUncached(encodedUsername, key, options);
  };

  return dedupeRequest(pendingProfiles, key, load);
}

async function fetchProfileUncached(
  encodedUsername: string,
  key: string,
  options: FetchOptions
): Promise<GitHubUserProfile> {
  const res = await fetchWithRetry(`${GITHUB_REST_URL}/users/${encodedUsername}`, {
    headers: getHeaders(),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throwIfRateLimited(res);
    if (res.status === 404) throw new Error('User not found');
    if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new Error('API Rate Limit Exceeded');
    }
    if (res.status === 429) {
      throw new Error('API Rate Limit Exceeded');
    }
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  const profile = (await res.json()) as GitHubUserProfile;
  if (!options.bypassCache) await profileCache.set(key, profile, GITHUB_CACHE_TTL_MS);
  return profile;
}

export async function fetchUserRepos(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubRepo[]> {
  const key = cacheKey('repos', username);
  const encodedUsername = encodeURIComponent(username);

  if (options.bypassCache) {
    return fetchReposUncached(encodedUsername, key, options);
  }

  const load = async (): Promise<GitHubRepo[]> => {
    const cached = await reposCache.get(key);
    if (cached) return cached;
    return fetchReposUncached(encodedUsername, key, options);
  };

  return dedupeRequest(pendingRepos, key, load);
}

async function fetchReposUncached(
  encodedUsername: string,
  key: string,
  options: FetchOptions
): Promise<GitHubRepo[]> {
  const firstPageRes = await fetchWithRetry(
    `${GITHUB_REST_URL}/users/${encodedUsername}/repos?per_page=100&page=1&sort=pushed`,
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
          `${GITHUB_REST_URL}/users/${encodedUsername}/repos?per_page=100&page=${page}&sort=pushed`,
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

  if (!options.bypassCache) await reposCache.set(key, allRepos, GITHUB_CACHE_TTL_MS);
  return allRepos;
}

/* ==========================================================================
 * ORG AGGREGATION & EPIC FEATURES
 * ========================================================================== */

/**
 * Fetches members of an organization. (Used for Org Dashboards).
 */
export async function fetchOrgMembers(orgName: string): Promise<string[]> {
  const encodedOrgName = encodeURIComponent(orgName);
  const allMembers: string[] = [];
  const maxPages = 4;
  const perPage = 50;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/orgs/${encodedOrgName}/members?per_page=${perPage}&page=${page}`,
      {
        headers: getHeaders(),
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(`Failed to fetch members for org ${orgName}`);
    const members = (await res.json()) as { login: string }[];
    if (members.length === 0) break;

    allMembers.push(...members.map((m) => m.login));

    // If the page returned fewer members than perPage, we've reached the end
    if (members.length < perPage) break;
  }

  return allMembers;
}

/**
 * Generates an aggregated Organization Mega-Dashboard.
 */
export async function getOrgDashboardData(orgName: string, options: FetchOptions = {}) {
  const [profileData, reposData, membersOrError] = await Promise.all([
    fetchUserProfile(orgName, options),
    fetchUserRepos(orgName, options),
    fetchOrgMembers(orgName).catch((err) => err as Error),
  ]);

  if (profileData.type !== 'Organization')
    throw new Error('This endpoint is strictly for organizations.');
  if (membersOrError instanceof Error) throw membersOrError;

  const members: string[] = membersOrError;
  const calendars = (
    await Promise.all(
      members.map((m) =>
        fetchGitHubContributions(m, options)
          .then((d) => d.calendar)
          .catch(() => null)
      )
    )
  ).filter((c): c is ContributionCalendar => c !== null);

  const aggregatedCalendar = aggregateCalendars(calendars);
  const streakStats = calculateStreak(aggregatedCalendar);
  const totalStars = reposData.reduce((acc, r) => acc + r.stargazers_count, 0);

  const profile = {
    ...buildProfileData(profileData, totalStars, 100),
    bio: profileData.bio || 'Open Source Organization',
    location: profileData.location || 'Global',
    isPro: false,
    stats: {
      repositories: profileData.public_repos,
      followers: profileData.followers,
      following: members.length,
      stars: totalStars,
    },
  };

  return {
    profile,
    stats: {
      currentStreak: streakStats.currentStreak,
      peakStreak: streakStats.longestStreak,
      totalContributions: streakStats.totalContributions,
    },
    calendar: aggregatedCalendar,
  };
}
export function generateAchievements(
  totalContributions: number,
  currentStreak: number,
  weekendCommits: number = 0,
  uniqueLanguages: number = 0,
  longestStreak: number = currentStreak
) {
  const achievements = [];

  // ── Contribution milestones ────────────────────────────────────────────────
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

  // ── Streak milestones ──────────────────────────────────────────────────────
  for (const threshold of STREAK_MILESTONES) {
    achievements.push({
      id: `streak-${threshold}`,
      title: threshold === 3 ? 'Getting Started' : `${threshold} Day Streak`,
      description:
        threshold === 3
          ? 'Maintained a 3-day coding streak'
          : `Maintained a ${threshold}-day coding streak`,
      icon: '🔥',
      isUnlocked: longestStreak >= threshold,
      type: 'streak' as const,
      threshold,
      currentValue: longestStreak,
      progress: Math.min(100, Math.round((longestStreak / threshold) * 100)),
    });
  }

  // ── Consistency King (tiered total-contribution milestones) ────────────────
  const CONSISTENCY_MILESTONES = [500, 1000, 2000] as const;
  const CONSISTENCY_LABELS = [
    'Consistency King',
    'Consistency King II',
    'Consistency King III',
  ] as const;
  for (let i = 0; i < CONSISTENCY_MILESTONES.length; i++) {
    const threshold = CONSISTENCY_MILESTONES[i];
    achievements.push({
      id: `consistency-${threshold}`,
      title: CONSISTENCY_LABELS[i],
      description: `Reached ${threshold.toLocaleString()} total contributions`,
      icon: '👑',
      isUnlocked: totalContributions >= threshold,
      type: 'contributions' as const,
      threshold,
      currentValue: totalContributions,
      progress: Math.min(100, Math.round((totalContributions / threshold) * 100)),
    });
  }

  // ── Weekend Warrior ────────────────────────────────────────────────────────
  // Computed from commitClock: dayTotals[0] (Sun) + dayTotals[6] (Sat).
  achievements.push({
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: '10+ contributions on weekends (Sat & Sun)',
    icon: '🏋️',
    isUnlocked: weekendCommits >= 10,
    type: 'behavior' as const,
    threshold: 10,
    currentValue: weekendCommits,
    progress: Math.min(100, Math.round((weekendCommits / 10) * 100)),
  });

  // ── Polyglot ───────────────────────────────────────────────────────────────
  // Computed from fetchUserRepos: count of distinct repo.language values.
  achievements.push({
    id: 'polyglot',
    title: 'Polyglot',
    description: 'Used 5+ distinct programming languages',
    icon: '🐙',
    isUnlocked: uniqueLanguages >= 5,
    type: 'behavior' as const,
    threshold: 5,
    currentValue: uniqueLanguages,
    progress: Math.min(100, Math.round((uniqueLanguages / 5) * 100)),
  });

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

export async function fetchContributedRepos(
  username: string,
  options: FetchOptions = {}
): Promise<Record<string, unknown>[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            nameWithOwner
            owner { login }
            stargazerCount
            forkCount
            primaryLanguage { name }
            updatedAt
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
      variables: { login: username },
    }),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data?.data?.user?.repositoriesContributedTo?.nodes || [];
}

export interface DeveloperScoreInput {
  repos: number;
  followers: number;
  stars: number;
  contributions: number;
  longestStreak: number;
}

export function computeDeveloperScore({
  repos,
  followers,
  stars,
  contributions,
  longestStreak,
}: DeveloperScoreInput): number {
  return Math.min(
    Math.round(
      Math.min(repos * 0.5, 25) +
        Math.min(followers * 0.5, 25) +
        Math.min(stars * 0.2, 20) +
        Math.min(contributions / 20, 20) +
        Math.min(longestStreak * 0.2, 10)
    ),
    100
  );
}

export function buildProfileData(
  profileData: GitHubUserProfile,
  totalStars: number,
  developerScore: number
) {
  return {
    username: profileData.login,
    name: displayName(profileData),
    avatarUrl: profileData.avatar_url,
    isPro: profileData.plan?.name === 'pro',
    bio: profileData.bio?.trim() || 'No bio available',
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
}

export function aggregateLanguages(repos: { language: string | null }[]) {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      color: LANGUAGE_COLORS[name] ?? '#a855f7',
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

export function buildActivityMap(
  allDays: (ContributionDay & { locAdditions?: number; locDeletions?: number })[]
) {
  return allDays.map((day) => {
    const c = day.contributionCount;
    const intensity: 0 | 1 | 2 | 3 | 4 = c === 0 ? 0 : c <= 3 ? 1 : c <= 6 ? 2 : c <= 10 ? 3 : 4;
    return {
      date: day.date,
      count: c,
      intensity,
      locAdditions: day.locAdditions,
      locDeletions: day.locDeletions,
    };
  });
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
  const [profileResult, reposResult, calendarResult, contributedReposResult] =
    await Promise.allSettled([
      fetchUserProfile(username, options),
      fetchUserRepos(username, options),
      fetchGitHubContributions(username, options),
      fetchContributedRepos(username, options),
    ]);

  if (profileResult.status === 'rejected')
    throw new Error(`[GitHub API] Failed to fetch profile for user "${username}"`, {
      cause: profileResult.reason,
    });

  const profileData = profileResult.value;
  const reposData = reposResult.status === 'fulfilled' ? reposResult.value : [];
  const calendarData =
    calendarResult.status === 'fulfilled'
      ? calendarResult.value.calendar
      : ({ totalContributions: 0, weeks: [] } as ContributionCalendar);
  const repoContributions =
    calendarResult.status === 'fulfilled' ? (calendarResult.value.repoContributions ?? []) : [];
  const contributedRepos =
    contributedReposResult.status === 'fulfilled' ? contributedReposResult.value : [];

  const streakStats = calculateStreak(calendarData);
  const totalStars = reposData.reduce((acc, r) => acc + r.stargazers_count, 0);
  const score = computeDeveloperScore({
    repos: profileData.public_repos,
    followers: profileData.followers,
    stars: totalStars,
    contributions: streakStats.totalContributions,
    longestStreak: streakStats.longestStreak,
  });
  const allDays = calendarData.weeks.flatMap((w) => w.contributionDays);
  const commitClock = buildCommitClock(allDays);
  const weekendCommits =
    (commitClock.find((d) => d.day === 'Sun')?.commits ?? 0) +
    (commitClock.find((d) => d.day === 'Sat')?.commits ?? 0);

  // Language breakdown from repoContributions (weighted by commit count)
  const langCounts: Record<string, number> = {};
  repoContributions.forEach((c) => {
    const l = c.repository.primaryLanguage?.name;
    if (l) langCounts[l] = (langCounts[l] || 0) + c.contributions.totalCount;
  });
  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      color: LANGUAGE_COLORS[name] ?? '#a855f7',
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Graph nodes/links
  const nodes: GraphNode[] = [
    {
      id: profileData.login,
      name: displayName(profileData),
      type: 'User',
      val: 30,
      color: '#E2E8F0',
    },
  ];
  const links: GraphLink[] = [];
  reposData.forEach((r) => {
    nodes.push({
      id: r.name,
      name: r.name,
      type: r.fork ? 'Fork' : 'Repo',
      val: Math.max(5, Math.min(20, r.stargazers_count + 5)),
      color: r.fork ? '#F97316' : '#3B82F6',
      stats: {
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        updatedAt: r.updated_at,
      },
    });
    links.push({ source: profileData.login, target: r.name });
  });
  contributedRepos.forEach((item) => {
    const r = item as {
      name: string;
      nameWithOwner: string;
      stargazerCount?: number;
      forkCount?: number;
      primaryLanguage?: { name: string } | null;
      updatedAt?: string;
    };
    nodes.push({
      id: r.nameWithOwner,
      name: r.name,
      type: 'Contribution',
      val: Math.max(5, Math.min(20, (r.stargazerCount ?? 0) / 10 + 5)),
      color: '#22C55E',
      stats: {
        stars: r.stargazerCount,
        forks: r.forkCount,
        language: r.primaryLanguage?.name,
        updatedAt: r.updatedAt,
      },
    });
    links.push({ source: profileData.login, target: r.nameWithOwner });
  });

  return {
    profile: buildProfileData(profileData, totalStars, score),
    stats: {
      currentStreak: streakStats.currentStreak,
      peakStreak: streakStats.longestStreak,
      totalContributions: streakStats.totalContributions,
    },
    languages,
    activity: buildActivityMap(allDays),
    insights: buildInsights(streakStats, languages),
    achievements: generateAchievements(
      streakStats.totalContributions,
      streakStats.currentStreak,
      weekendCommits,
      Object.keys(langCounts).length,
      streakStats.longestStreak
    ),
    commitClock,
    graphData: { nodes, links },
  };
}

export async function getWrappedData(
  username: string,
  year: string,
  options?: FetchOptions
): Promise<import('../types/dashboard').WrappedStats> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const fetchOptions: FetchOptions = {
    from,
    to,
    bypassCache: options?.bypassCache ?? false,
    signal: options?.signal,
  };

  const [userData, repos] = await Promise.all([
    fetchGitHubContributions(username, fetchOptions),
    fetchUserRepos(username, fetchOptions),
  ]);
  const calendar = userData.calendar;

  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);

  const totalContributions = calendar.totalContributions;

  const mostActiveDay = allDays.reduce(
    (max, d) => (d.contributionCount > max.contributionCount ? d : max),
    allDays[0] ?? { date: '', contributionCount: 0 }
  );

  const monthTotals: Record<string, number> = {};
  for (const day of allDays) {
    const month = day.date.slice(0, 7);
    monthTotals[month] = (monthTotals[month] || 0) + day.contributionCount;
  }
  const busiestMonth =
    Object.entries(monthTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? `${year}-01`;

  const weekendDays = allDays.filter((d) => {
    const dow = new Date(d.date).getUTCDay();
    return dow === 0 || dow === 6;
  });
  const weekendTotal = weekendDays.reduce((sum, d) => sum + d.contributionCount, 0);
  const weekendRatio =
    totalContributions > 0 ? Math.round((weekendTotal / totalContributions) * 100) : 0;

  const langCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
  }
  const topLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';

  return {
    totalContributions,
    mostActiveDate: mostActiveDay.date,
    highestDailyCount: mostActiveDay.contributionCount,
    busiestMonth,
    weekendRatio,
    topLanguage,
  };
}
