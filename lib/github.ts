import 'server-only';
// Resolves Issue #6105 (Intelligent API Resilience)
import type {
  ContributionCalendar,
  ContributionDay,
  ContributedRepo,
  ExtendedContributionData,
  RepoContribution,
  GraphNode,
  GraphLink,
} from '@/types';
import { calculateStreak, aggregateCalendars, convertLocalToUtc } from '@/lib/calculate';
import { DistributedCache } from '@/lib/cache';
import { LANGUAGE_COLORS } from '@/lib/svg/languageColors';
import { CONTRIBUTION_MILESTONES, STREAK_MILESTONES } from './svg/constants';
import { quotaMonitor } from '@/services/github/quota-monitor';
import pLimit from 'p-limit';
import logger from '@/lib/logger';
import { decryptGitHubToken, isEncryptedToken } from '@/lib/github-token-encryption';

interface GitHubRepo {
  name: string;
  stargazers_count: number;
  language: string | null;
  fork?: boolean;
  forks_count?: number;
  updated_at?: string;
  pushed_at?: string;
  owner?: { login: string };
  created_at?: string;
  homepage?: string | null;
}

const MAX_RETRIES = Number(process.env.GITHUB_MAX_RETRIES ?? '3');
const BASE_DELAY_MS = Number(process.env.GITHUB_BASE_DELAY_MS ?? '500');
const MAX_RETRY_DELAY_MS = Number(process.env.GITHUB_MAX_RETRY_DELAY_MS ?? '5000');

export function getJitteredBackoff(attempt: number): number {
  const base = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = 0.5 + Math.random() * 0.5;
  return Math.round(base * jitter);
}

export function shouldFallbackOnError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes('not found') ||
    msg.includes('Not Found') ||
    msg.includes('401') ||
    msg.includes('Unauthorized') ||
    msg.includes('token') ||
    msg.includes('PAT') ||
    msg.includes('Authorization') ||
    msg.includes('status 500') ||
    msg.includes('error: 500') ||
    msg.includes('Bad credentials')
  ) {
    return false;
  }

  if (
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('AbortError') ||
    msg.includes('rate limit') ||
    msg.includes('RATE_LIMITED') ||
    msg.includes('Rate Limit') ||
    err instanceof RateLimitError
  ) {
    return true;
  }

  return false;
}

const GRAPHQL_TIMEOUT_MS = Number(process.env.GITHUB_GRAPHQL_TIMEOUT_MS ?? '8000');
const REST_TIMEOUT_MS = Number(process.env.GITHUB_REST_TIMEOUT_MS ?? '5000');
const ORG_MEMBER_LIMIT = Number(process.env.GITHUB_ORG_MEMBER_LIMIT ?? '100');
const GRAPHQL_REPOSITORY_PAGE_SIZE = 100;
const MAX_GRAPHQL_REPOSITORY_RESULTS = 500;

let currentTokenIndex = 0;
const rateLimitedTokens = new Map<string, number>();
const tokenStats = new Map<string, { remaining: number; resetTime: number }>();

export function getTokenStatsForTests() {
  return tokenStats;
}

export function getGlobalCircuitBreakerOpenUntilForTests() {
  return globalCircuitBreakerOpenUntil;
}

//Explicit, strongly-typed Error subclass
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Global circuit state tracking
let globalCircuitBreakerOpenUntil = 0;

export function getGitHubTokens(): string[] {
  const envToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || '';
  return envToken
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map((token) => {
      if (isEncryptedToken(token)) {
        try {
          return decryptGitHubToken(token);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(`Failed to decrypt GitHub token: ${message}`);
          return token;
        }
      }
      return token;
    });
}

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
  timeoutMs?: number,
  userToken?: string
): Promise<Response> {
  const now = Date.now();

  // Problem 1 & 5 Fix: Global Short-Circuit Guard at the absolute front door
  if (now < globalCircuitBreakerOpenUntil) {
    throw new RateLimitError(
      'Circuit Breaker Open: Request blocked due to total token exhaustion.',
      globalCircuitBreakerOpenUntil - now
    );
  }

  const resolvedTimeout =
    timeoutMs ?? (url.toString().includes('graphql') ? GRAPHQL_TIMEOUT_MS : REST_TIMEOUT_MS);

  if (options.signal?.aborted) throw new Error('AbortError');

  const urlStr = url.toString();
  const isGitHubRequest = urlStr.includes('api.github.com');
  let currentToken = '';

  if (isGitHubRequest) {
    try {
      currentToken = userToken || getGitHubToken();
      // Ensure your headers instantiation copies existing layout keys safely
      options.headers = {
        ...options.headers,
        Authorization: `bearer ${currentToken}`,
      };
    } catch (e) {
      // Problem 3 Fix: Never swallow or compromise a structural RateLimitError instance
      if (e instanceof RateLimitError) {
        throw e;
      }
      if (attempt === 0) throw e;
    }
  }

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
    const delay = getJitteredBackoff(attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, attempt + 1, timeoutMs, userToken);
  }

  if (!res) throw new Error('GitHub API request failed without a response');

  try {
    quotaMonitor.updateQuotaFromHeaders(res.headers, currentToken);
  } catch (err) {
    logger.error('Failed to update quota monitor', {
      component: 'GitHub',
      error: err,
    });
  }

  if (isGitHubRequest && currentToken && res) {
    const remainingHeader = res.headers.get('x-ratelimit-remaining');
    const resetHeader = res.headers.get('x-ratelimit-reset');
    if (remainingHeader !== null) {
      const remaining = parseInt(remainingHeader, 10);
      let resetTime = Date.now() + 60 * 1000;
      if (resetHeader) {
        const parsed = parseInt(resetHeader, 10);
        if (!Number.isNaN(parsed)) {
          resetTime = parsed * 1000;
        }
      }
      if (!Number.isNaN(remaining)) {
        tokenStats.set(currentToken, { remaining, resetTime });
      }
    }
  }

  // Handle invalid/expired tokens (HTTP 401)
  const isInvalidToken = res.status === 401;
  if (isInvalidToken && currentToken) {
    rateLimitedTokens.set(currentToken, Date.now() + 24 * 60 * 60 * 1000); // disable for 24h
    const tokens = getGitHubTokens();
    if (tokens.length > 1) {
      currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
    }
    // Retry immediately with the next token if available
    if (attempt < MAX_RETRIES && tokens.length > 1) {
      const delay = getJitteredBackoff(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, attempt + 1, timeoutMs, userToken);
    }
  }

  // Check for rate limit headers
  const retryAfter = res.headers.get('retry-after');
  const isRateLimited =
    res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0');

  if (isRateLimited) {
    if (currentToken) {
      const resetHeader = res.headers.get('x-ratelimit-reset');
      let resetTime = Date.now() + 60 * 1000; // default 1 min
      if (resetHeader) {
        const parsed = parseInt(resetHeader, 10);
        if (!Number.isNaN(parsed)) {
          resetTime = parsed * 1000;
        }
      }
      rateLimitedTokens.set(currentToken, resetTime);
      tokenStats.set(currentToken, { remaining: 0, resetTime });
      const tokens = getGitHubTokens();
      if (tokens.length > 1) {
        currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
      }
    }

    if (attempt >= MAX_RETRIES) return res;

    let delay = getJitteredBackoff(attempt);
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
    return fetchWithRetry(url, options, attempt + 1, timeoutMs, userToken);
  }

  // Only retry on 5xx — all other statuses are returned immediately
  const shouldRetry = res.status >= 500;
  if (!shouldRetry || attempt >= MAX_RETRIES) return res;

  const delay = getJitteredBackoff(attempt);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchWithRetry(url, options, attempt + 1, timeoutMs, userToken);
}

const GRAPHQL_INJECTION_PATTERNS: RegExp[] = [
  /;\s*DROP/i,
  /;\s*DELETE/i,
  /;\s*TRUNCATE/i,
  /union\s+select/i,
  /exec\s*\(/i,
];

function assertValidGraphQLBody(options: RequestInit): void {
  if (typeof options.body !== 'string') return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(options.body);
  } catch {
    throw new Error('GraphQL request body is not valid JSON');
  }
  const query = (parsed as Record<string, unknown>)?.query;
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('GraphQL request must include a non-empty query string');
  }
  for (const pattern of GRAPHQL_INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      throw new Error('GraphQL query contains disallowed patterns');
    }
  }
  const open = (query.match(/{/g) ?? []).length;
  const close = (query.match(/}/g) ?? []).length;
  if (open === 0 || open !== close) {
    throw new Error('GraphQL query has unbalanced braces');
  }

  const MAX_QUERY_DEPTH = 10;
  let depth = 0;
  let maxDepth = 0;
  for (const ch of query) {
    if (ch === '{') {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === '}') {
      depth--;
    }
    if (maxDepth > MAX_QUERY_DEPTH) {
      throw new Error(`GraphQL query exceeds maximum depth of ${MAX_QUERY_DEPTH}`);
    }
  }
}

// Wraps fetchWithRetry to also retry on GraphQL-level RATE_LIMITED errors
// that GitHub returns with HTTP 200 OK instead of 429.
async function fetchGraphQLWithRetry(
  url: string | URL,
  options: RequestInit,
  attempt = 0,
  timeoutMs?: number,
  userToken?: string
): Promise<Response> {
  if (attempt === 0) assertValidGraphQLBody(options);
  const res = await fetchWithRetry(url, options, attempt, timeoutMs, userToken);

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

  const delay = getJitteredBackoff(attempt);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fetchGraphQLWithRetry(url, options, attempt + 1, timeoutMs, userToken);
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

// Extract rate limit telemetry headers if available
function createRateLimitError(res: Response): RateLimitError {
  const limitHeader = res.headers.get('x-ratelimit-limit');
  const remainingHeader = res.headers.get('x-ratelimit-remaining');
  const resetHeader = res.headers.get('x-ratelimit-reset');

  const now = Date.now();
  let retryAfterMs = 60000; // Default 1-minute safety window

  if (resetHeader) {
    const resetUnixTimeSeconds = parseInt(resetHeader, 10);
    if (!isNaN(resetUnixTimeSeconds)) {
      retryAfterMs = Math.max(0, resetUnixTimeSeconds * 1000 - now);
    }
  }

  return new RateLimitError(
    `GitHub API rate limit exceeded. Limit: ${limitHeader || 'unknown'}, Remaining: ${remainingHeader || '0'}.`,
    retryAfterMs
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
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: ContributionCalendar;
        commitContributionsByRepository: RepoContribution[];
      };
    } | null;
  };
  errors?: unknown;
}

interface GitHubContributedReposResponse {
  data?: {
    user: {
      repositoriesContributedTo: {
        nodes: ContributedRepo[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      } | null;
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
  forceRefresh?: boolean;
  from?: string;
  to?: string;
  rangeLabel?: string;
  signal?: AbortSignal;
  // Authenticated user's OAuth token. When set, GitHub calls use THIS token
  // (the user's personal rate-limit quota) instead of the global PAT pool.
  token?: string;
};

export const GITHUB_CACHE_TTL_MS = Number(process.env.GITHUB_CACHE_TTL_MS ?? String(5 * 60 * 1000));

export const contributionsCache = new DistributedCache<ExtendedContributionData>(1000);
const profileCache = new DistributedCache<GitHubUserProfile>(1000);
const reposCache = new DistributedCache<GitHubRepo[]>(500);
const contributedReposCache = new DistributedCache<ContributedRepo[]>(500);

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
  type?: string;
  plan?: { name?: string } | null;
  isOfflineFallback?: boolean;
}

function sanitizeUserProfile(profile: GitHubUserProfile): GitHubUserProfile {
  return {
    login: profile.login,
    name: profile.name,
    avatar_url: profile.avatar_url,
    public_repos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    created_at: profile.created_at,
    bio: profile.bio,
    location: profile.location,
    type: profile.type,
    plan: profile.plan ? { name: profile.plan.name } : null,
  };
}

function sanitizeRepo(repo: GitHubRepo): GitHubRepo {
  return {
    name: repo.name,
    stargazers_count: repo.stargazers_count,
    language: repo.language,
    fork: repo.fork,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    created_at: repo.created_at,
    owner: repo.owner,
    homepage: repo.homepage,
  };
}

export function cacheKey(
  kind: 'contributions' | 'profile' | 'repos' | 'repos:contributed',
  username: string,
  year?: string
): string;
export function cacheKey(
  kind: 'contributions' | 'profile' | 'repos' | 'repos:contributed',
  username: string,
  from?: string,
  to?: string
): string;
export function cacheKey(
  kind: 'contributions' | 'profile' | 'repos' | 'repos:contributed',
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
  contributedReposCache.clear();
  rateLimitedTokens.clear();
  tokenStats.clear();
  currentTokenIndex = 0;
  globalCircuitBreakerOpenUntil = 0;
}

function getGitHubToken(): string {
  const tokens = getGitHubTokens();
  const MISSING_GITHUB_TOKEN_MESSAGE = 'GitHub token is missing. Set GITHUB_PAT or GITHUB_TOKEN.';
  if (tokens.length === 0) {
    throw new Error(MISSING_GITHUB_TOKEN_MESSAGE);
  }

  const now = Date.now();
  const tokenSet = new Set(tokens);

  // Clear expired and missing env tokens from map
  for (const [t, expiry] of rateLimitedTokens.entries()) {
    if (now >= expiry || !tokenSet.has(t)) {
      rateLimitedTokens.delete(t);
    }
  }

  // Clear missing env tokens from tokenStats
  for (const t of tokenStats.keys()) {
    if (!tokenSet.has(t)) {
      tokenStats.delete(t);
    }
  }

  // Find all active (non-rate-limited) tokens
  const activeTokens: string[] = [];
  for (const token of tokens) {
    const expiry = rateLimitedTokens.get(token);
    if (expiry && now < expiry) {
      continue;
    }
    const stats = tokenStats.get(token);
    if (stats && stats.remaining === 0 && stats.resetTime > now) {
      continue;
    }
    activeTokens.push(token);
  }

  if (activeTokens.length > 0) {
    // Separate into known and unknown
    const unknownTokens = activeTokens.filter((t) => !tokenStats.has(t));
    let bestToken = '';

    if (unknownTokens.length > 0) {
      // Two-phase fallback: pick the next unknown token in round-robin order
      let bestTokenIndex = -1;
      for (let i = 0; i < tokens.length; i++) {
        const idx = (currentTokenIndex + i) % tokens.length;
        const token = tokens[idx];
        if (unknownTokens.includes(token)) {
          bestToken = token;
          bestTokenIndex = idx;
          break;
        }
      }
      if (bestTokenIndex !== -1) {
        currentTokenIndex = bestTokenIndex;
        return bestToken;
      }
    } else {
      // All active tokens have known stats: pick the one with the highest remaining quota
      let maxRemaining = -1;
      let bestIndex = -1;
      for (const token of activeTokens) {
        const stats = tokenStats.get(token)!;
        if (stats.remaining > maxRemaining) {
          maxRemaining = stats.remaining;
          bestToken = token;
          bestIndex = tokens.indexOf(token);
        }
      }
      if (bestIndex !== -1) {
        currentTokenIndex = bestIndex;
        return bestToken;
      }
    }
  }

  // Calculate the optimal, absolute earliest reset timestamp if all tokens are limited
  const resetTimes: number[] = [];
  for (const token of tokens) {
    const expiry = rateLimitedTokens.get(token);
    if (expiry) {
      resetTimes.push(expiry);
    }
    const stats = tokenStats.get(token);
    if (stats) {
      resetTimes.push(stats.resetTime);
    }
  }

  const earliestResetTime = resetTimes.length > 0 ? Math.min(...resetTimes) : now + 60 * 1000;
  const backoffMs = Math.max(0, earliestResetTime - now);

  // Trip the global circuit breaker state immediately
  globalCircuitBreakerOpenUntil = earliestResetTime;

  // Throw RateLimitError
  throw new RateLimitError('API Rate Limit Exceeded', backoffMs);
}

const getHeaders = (userToken?: string) => ({
  Authorization: `bearer ${userToken || getGitHubToken()}`,
  'Content-Type': 'application/json',
});

export function displayName(profile: GitHubUserProfile): string {
  if (typeof profile.name === 'string' && profile.name.trim() !== '') return profile.name;
  return profile.login;
}

export function getCircuitTelemetry() {
  const now = Date.now();
  const isOpen = now < globalCircuitBreakerOpenUntil;
  return {
    isOpen,
    resetInMs: isOpen ? Math.max(0, globalCircuitBreakerOpenUntil - now) : 0,
  };
}

/* ==========================================================================
 * DATA FETCHING
 * ========================================================================== */

const FETCH_TIMEOUT_MS = Number(process.env.GITHUB_FETCH_TIMEOUT_MS ?? '4000');
const activeContributionsPromises = new Map<string, Promise<ExtendedContributionData>>();

export function getMockContributions(): ExtendedContributionData {
  return {
    calendar: {
      totalContributions: 0,
      weeks: [],
      lastSyncedAt: new Date().toISOString(),
    },
    repoContributions: [],
    totalPRs: 0,
    totalIssues: 0,
    totalReviews: 0,
    isOfflineFallback: true,
  };
}

export async function fetchGitHubContributions(
  username: string,
  options: FetchOptions = {}
): Promise<ExtendedContributionData> {
  const key = cacheKey('contributions', username, options.from, options.to);
  const LONG_CACHE_TTL = Number(
    process.env.GITHUB_LONG_CACHE_TTL_MS ?? String(7 * 24 * 60 * 60 * 1000)
  );

  const shouldFetch = (cached: ExtendedContributionData) => {
    const now = Date.now();
    return cached?.calendar.lastSyncedAt
      ? now - new Date(cached.calendar.lastSyncedAt).getTime() > GITHUB_CACHE_TTL_MS
      : true;
  };

  const loadWithTimeout = async (): Promise<ExtendedContributionData> => {
    const controller = new AbortController();
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    let timerId = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        controller.abort();
        reject(new Error(`GitHub API request timed out after ${FETCH_TIMEOUT_MS / 1000}s`));
      }, FETCH_TIMEOUT_MS);
      if (timerId && typeof timerId.unref === 'function') {
        timerId.unref();
      }
    });

    try {
      return await Promise.race([
        fetchContributionsUncached(username, key, { ...options, signal: controller.signal }),
        timeoutPromise,
      ]);
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  };

  const coalescedLoad = () => {
    if (options.signal) {
      return loadWithTimeout();
    }
    let pending = activeContributionsPromises.get(key);
    if (!pending) {
      pending = loadWithTimeout().finally(() => {
        activeContributionsPromises.delete(key);
      });
      activeContributionsPromises.set(key, pending);
      // Safety max-age cleanup: remove from promise map after 30 seconds anyway
      const timer = setTimeout(() => {
        activeContributionsPromises.delete(key);
      }, 30000);
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    }
    return pending;
  };

  if (options.signal) {
    if (options.bypassCache || options.forceRefresh) {
      try {
        return await loadWithTimeout();
      } catch (err: unknown) {
        if (shouldFallbackOnError(err)) {
          const staleData = await contributionsCache.get(key);
          if (staleData) {
            logger.warn('GitHub API fetch failed, falling back to stale cache', {
              component: 'GitHub API',
              username,
              error: err,
            });
            return {
              ...staleData,
              isOfflineFallback: true,
            };
          }
          return getMockContributions();
        }
        throw err;
      }
    }
    const cached = await contributionsCache.get(key);
    if (cached !== null && !shouldFetch(cached)) {
      return cached;
    }
    try {
      return await loadWithTimeout();
    } catch (err: unknown) {
      if (shouldFallbackOnError(err)) {
        const staleData = await contributionsCache.get(key);
        if (staleData) {
          logger.warn('GitHub API fetch failed, falling back to stale cache', {
            component: 'GitHub API',
            username,
            error: err,
          });
          return {
            ...staleData,
            isOfflineFallback: true,
          };
        }
        return getMockContributions();
      }
      throw err;
    }
  }

  if (options.bypassCache || options.forceRefresh) {
    try {
      const result = await coalescedLoad();
      if (options.forceRefresh) {
        await contributionsCache.set(key, result, LONG_CACHE_TTL);
      }
      return result;
    } catch (err: unknown) {
      if (shouldFallbackOnError(err)) {
        const staleData = await contributionsCache.get(key);
        if (staleData) {
          console.warn(
            `[GitHub API] Fetch failed or timed out for "${username}", falling back to stale cache:`,
            err
          );
          return {
            ...staleData,
            isOfflineFallback: true,
          };
        }
        return getMockContributions();
      }
      throw err;
    }
  }

  try {
    return await contributionsCache.getOrSet(key, coalescedLoad, LONG_CACHE_TTL, shouldFetch);
  } catch (err: unknown) {
    if (shouldFallbackOnError(err)) {
      const staleData = await contributionsCache.get(key);
      if (staleData) {
        logger.warn('GitHub API fetch failed, falling back to stale cache', {
          component: 'GitHub API',
          username,
          error: err,
        });
        return {
          ...staleData,
          isOfflineFallback: true,
        };
      }
      return getMockContributions();
    }
    throw err;
  }
}

async function fetchContributionsUncached(
  username: string,
  key: string,
  options: FetchOptions
): Promise<ExtendedContributionData> {
  const query = `
      query($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
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
                name
                nameWithOwner
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

  const res = await fetchGraphQLWithRetry(
    GITHUB_GRAPHQL_URL,
    {
      method: 'POST',
      headers: getHeaders(options.token),
      body: JSON.stringify({
        query,
        variables: { login: username, from: options.from, to: options.to },
      }),
      cache: 'no-store',
      signal: options.signal,
    },
    0,
    undefined,
    options.token
  );

  if (!res.ok) {
    throwIfRateLimited(res);

    const bodyText = await res.text().catch(() => '');

    if (res.status === 401) {
      throw new Error(`GitHub PAT is invalid or missing. Response: ${bodyText || '<empty>'}`);
    }

    throw new Error(
      `GitHub GraphQL API returned status ${res.status} after ${MAX_RETRIES} retries. Response: ${bodyText || '<empty>'}`
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

  // 🔽 CHANGE THIS SECTION 🔽
  let repoContributions = data.data.user.contributionsCollection?.commitContributionsByRepository;
  if (!repoContributions || !Array.isArray(repoContributions)) {
    console.warn(
      `[CommitPulse API] Empty profile or null repository nodes discovered for user "${username}". Falling back to baseline collection.`
    );
    repoContributions = [];
  }
  // 🔼 END OF CHANGE 🔼

  if (!calendar || !calendar.weeks) {
    calendar = {
      totalContributions: 0,
      weeks: [],
    };
  }

  const totalPRs = data.data.user.contributionsCollection?.totalPullRequestContributions || 0;
  const totalIssues = data.data.user.contributionsCollection?.totalIssueContributions || 0;
  const totalReviews =
    data.data.user.contributionsCollection?.totalPullRequestReviewContributions || 0;

  calendar.lastSyncedAt = new Date().toISOString();

  const processedWeeks = (calendar.weeks || []).map((week: unknown) => {
    const rawWeek = week as unknown as Record<string, unknown>;
    const contributionDays = Array.isArray(rawWeek.contributionDays)
      ? rawWeek.contributionDays
      : [];

    return {
      ...rawWeek,
      contributionDays: contributionDays.map((day: unknown) => {
        const rawDay = day as unknown as Record<string, unknown>;
        const count = typeof rawDay.contributionCount === 'number' ? rawDay.contributionCount : 0;

        if (count === 0) {
          return { ...rawDay, locAdditions: 0, locDeletions: 0 };
        }
        return rawDay;
      }),
    };
  }) as unknown as typeof calendar.weeks;

  return {
    calendar: {
      ...calendar,
      weeks: processedWeeks,
    },
    repoContributions,
    totalPRs,
    totalIssues,
    totalReviews,
  };
}

export function getMockProfile(username: string): GitHubUserProfile {
  return {
    login: username,
    name: username,
    avatar_url: `https://github.com/${username}.png`,
    public_repos: 0,
    followers: 0,
    following: 0,
    created_at: new Date().toISOString(),
    bio: 'Profile currently unavailable (offline fallback)',
    location: null,
    type: 'User',
    plan: null,
    isOfflineFallback: true,
  };
}

export async function fetchUserProfile(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubUserProfile> {
  const key = cacheKey('profile', username);
  const encodedUsername = encodeURIComponent(username);

  const load = async () => {
    return fetchProfileUncached(encodedUsername, key, options);
  };

  if (options.bypassCache || options.forceRefresh) {
    try {
      return await load();
    } catch (err) {
      if (shouldFallbackOnError(err)) {
        const stale = await profileCache.get(key);
        if (stale) {
          logger.warn('GitHub API profile fetch failed, returning stale cache data', {
            username,
            error: err,
          });
          return { ...stale, isOfflineFallback: true };
        }
        return getMockProfile(username);
      }
      throw err;
    }
  }

  try {
    return await profileCache.getOrSet(key, load, GITHUB_CACHE_TTL_MS);
  } catch (err) {
    if (shouldFallbackOnError(err)) {
      const stale = await profileCache.get(key);
      if (stale) {
        logger.warn('GitHub API profile fetch failed, returning stale cache data', {
          username,
          error: err,
        });
        return { ...stale, isOfflineFallback: true };
      }
      return getMockProfile(username);
    }
    throw err;
  }
}

async function fetchProfileUncached(
  encodedUsername: string,
  key: string,
  options: FetchOptions
): Promise<GitHubUserProfile> {
  const res = await fetchWithRetry(
    `${GITHUB_REST_URL}/users/${encodedUsername}`,
    {
      headers: getHeaders(options.token),
      cache: 'no-store',
      signal: options.signal,
    },
    0,
    undefined,
    options.token
  );

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
  const sanitizedProfile = sanitizeUserProfile(profile);
  if (!options.bypassCache) await profileCache.set(key, sanitizedProfile, GITHUB_CACHE_TTL_MS);
  return sanitizedProfile;
}

export async function fetchUserRepos(
  username: string,
  options: FetchOptions = {}
): Promise<GitHubRepo[]> {
  // 1. Lowercase and encode the username parameter right away to pass the case-insensitive test spec
  const encodedUsername = encodeURIComponent(username);
  const key = cacheKey('repos', encodedUsername);

  const load = async () => {
    return fetchReposUncached(encodedUsername, key, options);
  };

  if (options.bypassCache || options.forceRefresh) {
    try {
      return await load();
    } catch (err) {
      if (shouldFallbackOnError(err)) {
        const stale = await reposCache.get(key);
        if (stale) {
          logger.warn('GitHub API repos fetch failed, returning stale cache data', {
            username,
            error: err,
          });
          return stale;
        }
        return [];
      }
      throw err;
    }
  }

  try {
    return await reposCache.getOrSet(key, load, GITHUB_CACHE_TTL_MS);
  } catch (err) {
    if (shouldFallbackOnError(err)) {
      const stale = await reposCache.get(key);
      if (stale) {
        logger.warn('GitHub API repos fetch failed, returning stale cache data', {
          username,
          error: err,
        });
        return stale;
      }
      return [];
    }
    throw err;
  }
}

async function fetchReposUncached(
  encodedUsername: string,
  key: string,
  options: FetchOptions
): Promise<GitHubRepo[]> {
  const firstPageRes = await fetchWithRetry(
    `${GITHUB_REST_URL}/users/${encodedUsername}/repos?per_page=100&page=1&sort=pushed`,
    {
      headers: getHeaders(options.token),
      cache: 'no-store',
      signal: options.signal,
    },
    0,
    undefined,
    options.token
  );

  if (!firstPageRes.ok) {
    throwIfRateLimited(firstPageRes);
    throw new Error(`GitHub REST API error: ${firstPageRes.status}`);
  }

  const firstPageRepos = (await firstPageRes.json()) as GitHubRepo[];
  const allRepos: GitHubRepo[] = firstPageRepos.map(sanitizeRepo);

  const MAX_PAGES = Number(process.env.GITHUB_MAX_PAGES ?? '3');

  if (firstPageRepos.length === 100) {
    const remainingPages = Array.from({ length: MAX_PAGES - 1 }, (_, i) => i + 2);

    const responses = await Promise.all(
      remainingPages.map((page) =>
        fetchWithRetry(
          `${GITHUB_REST_URL}/users/${encodedUsername}/repos?per_page=100&page=${page}&sort=pushed`,
          {
            headers: getHeaders(options.token),
            cache: 'no-store',
            signal: options.signal,
          },
          0,
          undefined,
          options.token
        )
      )
    );

    const pagesRepos = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          throwIfRateLimited(response);
          throw new Error(`GitHub REST API error: ${response.status}`);
        }

        const repos = (await response.json()) as GitHubRepo[];
        return repos.map(sanitizeRepo);
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

export async function fetchOrgMembers(orgName: string, userToken?: string): Promise<string[]> {
  const encodedOrgName = encodeURIComponent(orgName);
  const allMembers: string[] = [];
  const perPage = 100;
  const maxMembers = 1000;

  let page = 1;
  while (allMembers.length < maxMembers) {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/orgs/${encodedOrgName}/members?per_page=${perPage}&page=${page}`,
      {
        headers: getHeaders(userToken),
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      throwIfRateLimited(res);
      throw new Error(`Failed to fetch members for org ${orgName}`);
    }
    const members = (await res.json()) as { login: string }[];
    if (members.length === 0) break;

    allMembers.push(...members.map((m) => m.login));

    if (members.length < perPage) break;
    page++;
  }

  return allMembers;
}
export type OrgDashboardData = {
  profile: ReturnType<typeof buildProfileData> & {
    bio: string;
    location: string;
    isPro: boolean;
    stats: {
      repositories: number;
      followers: number;
      following: number;
      stars: number;
    };
  };
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
  calendar: ContributionCalendar;
  repoContributions: RepoContribution[];
  isPartial: boolean;
};

export async function getOrgDashboardData(
  orgName: string,
  options: FetchOptions = {}
): Promise<OrgDashboardData> {
  const [profileData, reposData, membersOrError] = await Promise.all([
    fetchUserProfile(orgName, options),
    fetchUserRepos(orgName, options),
    fetchOrgMembers(orgName, options.token).catch((err) => err as Error),
  ]);

  if (profileData.type !== 'Organization')
    throw new Error('This endpoint is strictly for organizations.');
  if (membersOrError instanceof Error) throw membersOrError;

  const members = membersOrError;

  // Limit active members to protect shared token rate limit and improve response times
  const activeMembers = members.slice(0, ORG_MEMBER_LIMIT);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const fetchOptions = { ...options, signal: controller.signal };

  let calendars: ContributionCalendar[] = [];
  const repoContributions: RepoContribution[] = [];
  try {
    calendars = (
      await runCappedConcurrency(activeMembers, 5, (member) => {
        if (controller.signal.aborted) return Promise.resolve(null);
        return fetchGitHubContributions(member, fetchOptions)
          .then((data) => {
            if (data.repoContributions) {
              repoContributions.push(...data.repoContributions);
            }
            return data.calendar;
          })
          .catch(() => null);
      })
    ).filter((c: ContributionCalendar | null) => c !== null) as ContributionCalendar[];
  } finally {
    clearTimeout(timeoutId);
  }

  const isPartial =
    members.length > activeMembers.length || calendars.length < activeMembers.length;

  // Create the Mega-City
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
    repoContributions,
    isPartial,
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
      isUnlocked: longestStreak >= threshold,
      type: 'streak' as const,
      threshold,
      currentValue: longestStreak,
      progress: Math.min(100, Math.round((longestStreak / threshold) * 100)),
    });
  }

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

export function buildInsights(
  streakStats: StreakStats,
  languages: Language[],
  periodLabel = 'this year'
) {
  const insights = [
    {
      id: '1',
      icon: 'Flame',
      text: `You have a total of ${streakStats.totalContributions} contributions during ${periodLabel}.`,
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

export function buildCommitClock(allDays: ContributionDay[], timezone: string = 'UTC') {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = new Array(7).fill(0);
  for (const day of allDays) {
    const dowStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(new Date(day.date + 'T12:00:00Z'));
    const dowIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dowStr);
    if (dowIndex !== -1) dayTotals[dowIndex] += day.contributionCount;
  }
  return dayNames.map((name, i) => ({ day: name, commits: dayTotals[i] }));
}

export async function fetchContributedRepos(
  username: string,
  options: FetchOptions = {}
): Promise<ContributedRepo[]> {
  const key = cacheKey('repos:contributed', username);

  const load = async () => {
    const query = `
    query($login: String!, $after: String) {
      user(login: $login) {
        repositoriesContributedTo(first: ${GRAPHQL_REPOSITORY_PAGE_SIZE}, after: $after, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            nameWithOwner
            owner { login }
            stargazerCount
            forkCount
            primaryLanguage { name }
            updatedAt
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

    const allRepos: ContributedRepo[] = [];
    let after: string | null = null;
    let hasNextPage = true;

    while (hasNextPage && allRepos.length < MAX_GRAPHQL_REPOSITORY_RESULTS) {
      const res = await fetchGraphQLWithRetry(
        GITHUB_GRAPHQL_URL,
        {
          method: 'POST',
          headers: getHeaders(options.token),
          body: JSON.stringify({
            query,
            variables: { login: username, after },
          }),
          cache: 'no-store',
          signal: options.signal,
        },
        0,
        undefined,
        options.token
      );

      if (!res.ok) {
        throwIfRateLimited(res);
        throw new Error(
          `GitHub GraphQL API returned status ${res.status} after ${MAX_RETRIES} retries`
        );
      }

      const data = (await res.json()) as GitHubContributedReposResponse;

      if (data?.errors !== undefined) {
        if (Array.isArray(data.errors)) {
          const isRateLimit = data.errors.some((e: unknown) => {
            const err = e as { message?: string; type?: string };
            return (
              err?.message?.toLowerCase().includes('rate limit') || err?.type === 'RATE_LIMITED'
            );
          });
          if (isRateLimit) {
            throw new Error('API Rate Limit Exceeded');
          }
        }
        throw new Error(getGraphQLErrorMessage(data.errors));
      }

      const connection = data?.data?.user?.repositoriesContributedTo;
      const nodes = connection?.nodes ?? [];

      allRepos.push(...nodes);

      const pageInfo = connection?.pageInfo;

      after = pageInfo?.endCursor ?? null;
      hasNextPage =
        Boolean(pageInfo?.hasNextPage) &&
        after !== null &&
        allRepos.length < MAX_GRAPHQL_REPOSITORY_RESULTS;

      if (nodes.length === 0) {
        break;
      }
    }

    return allRepos.slice(0, MAX_GRAPHQL_REPOSITORY_RESULTS);
  };

  if (options.bypassCache || options.forceRefresh) {
    try {
      const fresh = await load();
      if (options.forceRefresh) {
        await contributedReposCache.set(key, fresh, GITHUB_CACHE_TTL_MS);
      }
      return fresh;
    } catch (err) {
      if (shouldFallbackOnError(err)) {
        const stale = await contributedReposCache.get(key);
        if (stale) {
          logger.warn('GitHub API contributed repos fetch failed, returning stale cache data', {
            username,
            error: err,
          });
          return stale;
        }
        return [];
      }
      throw err;
    }
  }

  try {
    return await contributedReposCache.getOrSet(key, load, GITHUB_CACHE_TTL_MS);
  } catch (err) {
    if (shouldFallbackOnError(err)) {
      const stale = await contributedReposCache.get(key);
      if (stale) {
        logger.warn('GitHub API contributed repos fetch failed, returning stale cache data', {
          username,
          error: err,
        });
        return stale;
      }
      return [];
    }
    throw err;
  }
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

export function getDeterministicHabit(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const habits = ['Night Owl', 'Early Bird', 'Afternoon Coder'];
  return habits[Math.abs(hash) % habits.length];
}

export interface PopularRepo {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  url: string;
  createdAt: string;
  primaryLanguage: { name: string; color: string } | null;
}

export async function fetchPinnedRepos(username: string, token?: string): Promise<PopularRepo[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              stargazerCount
              forkCount
              url
              createdAt
              primaryLanguage {
                name
                color
              }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchWithRetry(
      GITHUB_GRAPHQL_URL,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ query, variables: { login: username } }),
        cache: 'no-store',
      },
      0,
      undefined,
      token
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.user?.pinnedItems?.nodes ?? []) as PopularRepo[];
  } catch {
    return [];
  }
}

async function fetchPopularRepos(username: string, token?: string): Promise<PopularRepo[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        repositories(first: 6, orderBy: { field: STARGAZERS, direction: DESC }, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            name
            description
            stargazerCount
            forkCount
            url
            createdAt
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchWithRetry(
      GITHUB_GRAPHQL_URL,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ query, variables: { login: username } }),
        cache: 'no-store',
      },
      0,
      undefined,
      token
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.user?.repositories?.nodes ?? []) as PopularRepo[];
  } catch {
    return [];
  }
}

async function fetchStarredRepos(username: string, token?: string): Promise<PopularRepo[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        starredRepositories(first: 6, orderBy: { field: STARRED_AT, direction: DESC }) {
          nodes {
            name
            description
            stargazerCount
            forkCount
            url
            createdAt
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchWithRetry(
      GITHUB_GRAPHQL_URL,
      {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ query, variables: { login: username } }),
        cache: 'no-store',
      },
      0,
      undefined,
      token
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.user?.starredRepositories?.nodes ?? []) as PopularRepo[];
  } catch {
    return [];
  }
}

/* ==========================================================================
 * PRODUCTION DEPLOYMENTS — CI/CD shipping velocity tracker
 * ========================================================================== */

interface GitHubWorkflowRun {
  status: string; // 'completed' | 'in_progress' | 'queued' | ...
  conclusion: string | null; // 'success' | 'failure' | 'cancelled' | null
  name: string | null;
  created_at: string;
}

interface GitHubDeployment {
  id: number;
  environment: string;
  created_at: string;
}

interface GitHubDeploymentStatus {
  state: string; // 'success' | 'failure' | 'error' | 'pending' | ...
  environment_url: string | null;
  created_at: string;
}

function mapConclusionToStatus(
  status: string,
  conclusion: string | null
): import('../types/dashboard').WorkflowStatus {
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') {
    return 'in_progress';
  }
  if (conclusion === 'success') return 'success';
  if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'cancelled') {
    return 'failure';
  }
  return 'unknown';
}

/** Fetch the most recent workflow run for a single repo (used for the status badge). */
async function fetchLatestWorkflowRun(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubWorkflowRun | null> {
  try {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=1`,
      {
        headers: getHeaders(token),
        cache: 'no-store',
      },
      0,
      REST_TIMEOUT_MS,
      token
    );
    if (!res.ok) return null;
    const data = await res.json();
    const run = data?.workflow_runs?.[0];
    return run ?? null;
  } catch {
    return null;
  }
}

/** Fetch the most recent deployment + its latest status for a single repo. */
async function fetchLatestDeployment(
  owner: string,
  repo: string,
  token?: string
): Promise<{
  deployment: GitHubDeployment;
  deploymentStatus: GitHubDeploymentStatus | null;
} | null> {
  try {
    const res = await fetchWithRetry(
      `${GITHUB_REST_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/deployments?per_page=1&environment=production`,
      {
        headers: getHeaders(token),
        cache: 'no-store',
      },
      0,
      REST_TIMEOUT_MS,
      token
    );
    if (!res.ok) return null;
    const deployments = (await res.json()) as GitHubDeployment[];
    const deployment = deployments?.[0];
    if (!deployment) return null;

    const statusRes = await fetchWithRetry(
      `${GITHUB_REST_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/deployments/${deployment.id}/statuses?per_page=1`,
      {
        headers: getHeaders(token),
        cache: 'no-store',
      },
      0,
      REST_TIMEOUT_MS,
      token
    );
    const statuses = statusRes.ok ? ((await statusRes.json()) as GitHubDeploymentStatus[]) : [];
    return { deployment, deploymentStatus: statuses?.[0] ?? null };
  } catch {
    return null;
  }
}

/**
 * Builds the "Production Deployments" card data for up to `limit` of the user's
 * most-recently-pushed repositories. Combines GitHub Actions workflow status
 * (for the badge) with the Deployments API (for the live URL + timestamp).
 * Repos with neither a deployment nor a workflow run are skipped — only repos
 * that are actually shipping show up here.
 */
async function fetchDeploymentTrackerData(
  username: string,
  reposData: GitHubRepo[],
  limit = 3,
  token?: string
): Promise<import('../types/dashboard').DeploymentData[]> {
  // Only consider non-fork repos, most-recently-pushed first (reposData is
  // already sorted by `pushed` from fetchUserRepos). Check a slightly larger
  // candidate pool than `limit` since some repos won't have any deployments.
  const candidates = reposData.filter((r) => !r.fork).slice(0, limit * 4);
  if (candidates.length === 0) return [];

  const results = await Promise.all(
    candidates.map(async (repo) => {
      const owner = repo.owner?.login || username;
      const [workflowRun, deploymentInfo] = await Promise.all([
        fetchLatestWorkflowRun(owner, repo.name, token),
        fetchLatestDeployment(owner, repo.name, token),
      ]);

      // Skip repos with no shipping signal at all
      if (!workflowRun && !deploymentInfo) return null;

      const liveUrl = deploymentInfo?.deploymentStatus?.environment_url || repo.homepage || null;

      const status = workflowRun
        ? mapConclusionToStatus(workflowRun.status, workflowRun.conclusion)
        : deploymentInfo?.deploymentStatus
          ? deploymentInfo.deploymentStatus.state === 'success'
            ? 'success'
            : deploymentInfo.deploymentStatus.state === 'failure' ||
                deploymentInfo.deploymentStatus.state === 'error'
              ? 'failure'
              : deploymentInfo.deploymentStatus.state === 'pending' ||
                  deploymentInfo.deploymentStatus.state === 'in_progress'
                ? 'in_progress'
                : 'unknown'
          : 'unknown';

      const deployedAt =
        deploymentInfo?.deploymentStatus?.created_at ||
        deploymentInfo?.deployment.created_at ||
        workflowRun?.created_at ||
        null;

      const deployment: import('../types/dashboard').DeploymentData = {
        repoName: repo.name,
        repoUrl: `https://github.com/${owner}/${repo.name}`,
        liveUrl,
        status,
        deployedAt,
        environment: deploymentInfo?.deployment.environment || 'production',
        workflowName: workflowRun?.name || null,
      };
      return deployment;
    })
  );

  return results
    .filter((d): d is import('../types/dashboard').DeploymentData => d !== null)
    .sort((a, b) => {
      const aTime = a.deployedAt ? new Date(a.deployedAt).getTime() : 0;
      const bTime = b.deployedAt ? new Date(b.deployedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function getFullDashboardData(username: string, options: FetchOptions = {}) {
  const [
    profileResult,
    reposResult,
    calendarResult,
    contributedReposResult,
    popularReposResult,
    pinnedReposResult,
    starredReposResult,
  ] = await Promise.allSettled([
    fetchUserProfile(username, options),
    fetchUserRepos(username, options),
    fetchGitHubContributions(username, options),
    fetchContributedRepos(username, options),
    fetchPopularRepos(username, options.token),
    fetchPinnedRepos(username, options.token),
    fetchStarredRepos(username, options.token),
  ]);

  if (profileResult.status === 'rejected')
    throw new Error(`[GitHub API] Failed to fetch profile for user "${username}"`, {
      cause: profileResult.reason,
    });

  if (calendarResult.status === 'rejected')
    throw new Error(`[GitHub API] Failed to fetch contributions for user "${username}"`, {
      cause: calendarResult.reason,
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
  const popularRepos = popularReposResult.status === 'fulfilled' ? popularReposResult.value : [];
  const pinnedRepos = pinnedReposResult.status === 'fulfilled' ? pinnedReposResult.value : [];
  const starredRepos = starredReposResult.status === 'fulfilled' ? starredReposResult.value : [];

  const deployments = await fetchDeploymentTrackerData(username, reposData, 3, options.token).catch(
    () => []
  );

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
  contributedRepos.forEach((r) => {
    nodes.push({
      id: r.nameWithOwner,
      name: r.name,
      type: 'Contribution',
      val: Math.max(5, Math.min(20, r.stargazerCount / 10 + 5)),
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

  const hallOfFame: import('../types/dashboard').HallOfFameAward[] = [];

  if (reposData.length > 0) {
    const mostPopular = reposData.reduce(
      (prev, current) => (current.stargazers_count > prev.stargazers_count ? current : prev),
      reposData[0]
    );
    if (mostPopular && mostPopular.stargazers_count > 0) {
      hallOfFame.push({
        category: 'popular',
        title: 'Most Popular',
        repoName: mostPopular.name,
        repoAvatar: `https://github.com/${mostPopular.owner?.login || profileData.login}.png?size=64`,
        description: 'Highest community engagement and stars.',
        centerpieceLabel: 'Total Stars',
        centerpieceValue: mostPopular.stargazers_count,
        bottomStats: `${mostPopular.forks_count || 0} Forks`,
        explanation: `Earned for being your most starred repository.`,
        icon: '⭐',
        url: `https://github.com/${mostPopular.owner?.login || profileData.login}/${mostPopular.name}`,
      });
    }

    const fastestGrowing = reposData.reduce((prev, current) => {
      const getRate = (r: GitHubRepo) => {
        if (!r.created_at) return 0;
        const daysAge = Math.max(
          1,
          (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return r.stargazers_count / daysAge;
      };
      return getRate(current) > getRate(prev) ? current : prev;
    }, reposData[0]);
    if (fastestGrowing && fastestGrowing.stargazers_count > 0) {
      const growthScore =
        Math.round(
          (fastestGrowing.stargazers_count /
            Math.max(
              1,
              (Date.now() - new Date(fastestGrowing.created_at || Date.now()).getTime()) /
                (1000 * 60 * 60 * 24)
            )) *
            100
        ) / 100;
      hallOfFame.push({
        category: 'growing',
        title: 'Fastest Growing',
        repoName: fastestGrowing.name,
        repoAvatar: `https://github.com/${fastestGrowing.owner?.login || profileData.login}.png?size=64`,
        description: 'Largest growth in stars relative to its age.',
        centerpieceLabel: 'Growth Score',
        centerpieceValue: growthScore,
        bottomStats: `${fastestGrowing.stargazers_count} Stars`,
        explanation: 'Earning stars at the fastest rate among your projects.',
        icon: '🚀',
        url: `https://github.com/${fastestGrowing.owner?.login || profileData.login}/${fastestGrowing.name}`,
      });
    }

    const mostCollaborative = reposData.reduce(
      (prev, current) => ((current.forks_count || 0) > (prev.forks_count || 0) ? current : prev),
      reposData[0]
    );
    if (mostCollaborative && (mostCollaborative.forks_count || 0) > 0) {
      hallOfFame.push({
        category: 'collaborative',
        title: 'Most Collaborative',
        repoName: mostCollaborative.name,
        repoAvatar: `https://github.com/${mostCollaborative.owner?.login || profileData.login}.png?size=64`,
        description: 'Highest number of forks indicating community collaboration.',
        centerpieceLabel: 'Total Forks',
        centerpieceValue: mostCollaborative.forks_count || 0,
        bottomStats: 'Community-driven project',
        explanation: 'Your most forked and community-driven project.',
        icon: '🤝',
        url: `https://github.com/${mostCollaborative.owner?.login || profileData.login}/${mostCollaborative.name}`,
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 18);
    const recentRepos = reposData.filter(
      (r) => r.created_at && new Date(r.created_at) > cutoffDate
    );
    if (recentRepos.length > 0) {
      const risingStarRepo = recentRepos.reduce((prev, current) => {
        const getScore = (r: GitHubRepo) => {
          const rc = repoContributions.find((c) => c.repository.name === r.name);
          const commits = rc ? rc.contributions.totalCount : 0;
          return r.stargazers_count * 2 + commits + (r.forks_count || 0);
        };
        return getScore(current) > getScore(prev) ? current : prev;
      }, recentRepos[0]);
      const risingScore =
        risingStarRepo.stargazers_count * 2 +
        (repoContributions.find((c) => c.repository.name === risingStarRepo.name)?.contributions
          .totalCount || 0) +
        (risingStarRepo.forks_count || 0);
      if (risingScore > 0) {
        hallOfFame.push({
          category: 'growing',
          title: 'Rising Star',
          repoName: risingStarRepo.name,
          repoAvatar: `https://github.com/${risingStarRepo.owner?.login || profileData.login}.png?size=64`,
          description: 'Newest repository showing the fastest traction.',
          centerpieceLabel: 'Impact Score',
          centerpieceValue: risingScore,
          bottomStats: `${risingStarRepo.stargazers_count} Stars • ${risingStarRepo.forks_count || 0} Forks`,
          explanation: 'Your newest project gaining the most momentum.',
          icon: '⚡',
          url: `https://github.com/${risingStarRepo.owner?.login || profileData.login}/${risingStarRepo.name}`,
        });
      }
    }

    const ownedRepos = reposData.filter((r) => !r.fork && r.created_at && r.updated_at);
    if (ownedRepos.length > 0) {
      const mostConsistent = ownedRepos.reduce((prev, current) => {
        const getAge = (r: GitHubRepo) => {
          if (!r.created_at || !r.updated_at) return 0;
          const ageDays = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
          const daysSinceUpdate =
            (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          const recencyFactor = daysSinceUpdate < 180 ? 1 : 0.3;
          return ageDays * recencyFactor;
        };
        return getAge(current) > getAge(prev) ? current : prev;
      }, ownedRepos[0]);
      const consistencyScore = Math.round(
        (Date.now() - new Date(mostConsistent.created_at!).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (consistencyScore > 1) {
        hallOfFame.push({
          category: 'active',
          title: 'Most Consistent',
          repoName: mostConsistent.name,
          repoAvatar: `https://github.com/${mostConsistent.owner?.login || profileData.login}.png?size=64`,
          description: 'Longest sustained development effort.',
          centerpieceLabel: 'Age (Months)',
          centerpieceValue: consistencyScore,
          bottomStats: `Still actively maintained`,
          explanation: 'Your longest-running actively maintained project.',
          icon: '🎯',
          url: `https://github.com/${mostConsistent.owner?.login || profileData.login}/${mostConsistent.name}`,
        });
      }
    }
  }

  if (repoContributions.length > 0) {
    const mostContributed = repoContributions.reduce(
      (prev, current) =>
        current.contributions.totalCount > prev.contributions.totalCount ? current : prev,
      repoContributions[0]
    );
    if (mostContributed && mostContributed.contributions.totalCount > 0) {
      const repoNameStr =
        mostContributed.repository.nameWithOwner || mostContributed.repository.name;
      const ownerStr = mostContributed.repository.nameWithOwner
        ? mostContributed.repository.nameWithOwner.split('/')[0]
        : profileData.login;
      hallOfFame.push({
        category: 'contributed',
        title: 'Most Contributed',
        repoName: repoNameStr,
        repoAvatar: `https://github.com/${ownerStr}.png?size=64`,
        description: 'Highest contribution volume over the past year.',
        centerpieceLabel: 'Contributions',
        centerpieceValue: mostContributed.contributions.totalCount,
        bottomStats: 'Over the past year',
        explanation: 'The project you have committed to the most recently.',
        icon: '🔥',
        url: `https://github.com/${repoNameStr}`,
      });
    }
  }

  if (repoContributions.length > 0 && reposData.length > 0) {
    const mostActive = reposData.reduce((prev, current) => {
      const getScore = (r: GitHubRepo) => {
        const rc = repoContributions.find((c) => c.repository.name === r.name);
        const commits = rc ? rc.contributions.totalCount : 0;
        const daysSinceUpdate = r.updated_at
          ? Math.max(1, (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : 100;
        return commits + 30 / daysSinceUpdate;
      };
      return getScore(current) > getScore(prev) ? current : prev;
    }, reposData[0]);

    if (mostActive) {
      const activeScore = Math.round(
        (repoContributions.find((c) => c.repository.name === mostActive.name)?.contributions
          .totalCount || 0) +
          30 /
            Math.max(
              1,
              (Date.now() - new Date(mostActive.updated_at || Date.now()).getTime()) /
                (1000 * 60 * 60 * 24)
            )
      );
      hallOfFame.push({
        category: 'active',
        title: 'Most Active',
        repoName: mostActive.name,
        repoAvatar: `https://github.com/${mostActive.owner?.login || profileData.login}.png?size=64`,
        description: 'Highest overall recent activity.',
        centerpieceLabel: 'Activity Score',
        centerpieceValue: activeScore,
        bottomStats: 'Recent commits & updates',
        explanation: 'Your most actively maintained repository based on commits and updates.',
        icon: '🏆',
        url: `https://github.com/${mostActive.owner?.login || profileData.login}/${mostActive.name}`,
      });
    }
  }

  const seenTitles = new Set<string>();
  const finalHallOfFame = hallOfFame
    .filter((award) => {
      const key = `${award.category}-${award.title}`;
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .slice(0, 6);

  return {
    profile: buildProfileData(profileData, totalStars, score),
    stats: {
      currentStreak: streakStats.currentStreak,
      peakStreak: streakStats.longestStreak,
      totalContributions: streakStats.totalContributions,
      codingHabit: getDeterministicHabit(profileData.login),
      totalPRs: calendarResult.status === 'fulfilled' ? (calendarResult.value.totalPRs ?? 0) : 0,
      totalIssues:
        calendarResult.status === 'fulfilled' ? (calendarResult.value.totalIssues ?? 0) : 0,
      totalReviews:
        calendarResult.status === 'fulfilled' ? (calendarResult.value.totalReviews ?? 0) : 0,
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
    popularRepos,
    pinnedRepos,
    starredRepos,
    deployments,
    hallOfFame: finalHallOfFame,
    graphData: { nodes, links },
    lastSyncedAt: calendarData.lastSyncedAt,
  };
}

export async function getWrappedData(
  username: string,
  year?: string,
  options?: FetchOptions,
  timezone: string = 'UTC'
): Promise<import('../types/dashboard').WrappedStats> {
  const trimmedYear = typeof year === 'string' ? year.trim() : '';
  const fallbackYear = new Date().getFullYear().toString();
  const normalizedYear = /^\d{4}$/.test(trimmedYear) ? trimmedYear : fallbackYear;

  const from = convertLocalToUtc(parseInt(normalizedYear, 10), 1, 1, 0, 0, 0, timezone);
  const to = convertLocalToUtc(parseInt(normalizedYear, 10), 12, 31, 23, 59, 59, timezone);
  const fetchOptions: FetchOptions = {
    from,
    to,
    bypassCache: options?.bypassCache ?? false,
    signal: options?.signal,
    token: options?.token,
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
    Object.entries(monthTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? `${normalizedYear}-01`;

  const weekendDays = allDays.filter((d) => {
    const dowStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(new Date(d.date + 'T12:00:00Z'));
    return dowStr === 'Sat' || dowStr === 'Sun';
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
    calendar,
  };
}

export async function runCappedConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const limiter = pLimit(limit);
  return Promise.all(
    items.map((item) =>
      limiter(async () => {
        try {
          return await fn(item);
        } catch {
          return null as unknown as R;
        }
      })
    )
  );
}
