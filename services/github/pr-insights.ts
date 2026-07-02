import 'server-only';
import { fetchWithRetry, getGitHubTokens } from '@/lib/github';
import { DistributedCache } from '@/lib/cache';

interface PRReviewNode {
  author: { login: string } | null;
  createdAt: string;
  state: string;
}

interface PRNode {
  id: string;
  title: string;
  url: string;
  state: string;
  createdAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  repository: { nameWithOwner: string } | null;
  comments: { totalCount: number } | null;
  reviews: {
    nodes: PRReviewNode[];
    totalCount: number;
  } | null;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const MAX_PAGES = 3;

export interface PRInsightData {
  totalPRs: number;
  openPRs: number;
  mergedPRs: number;
  closedPRs: number;
  mergeRate: number; // percentage
  avgReviewTime: number; // in hours
  avgTimeToFirstReview: number; // in hours
  avgCycleTime: number; // in hours (from creation to merge)

  weeklyActivity: { name: string; prs: number }[];
  monthlyActivity: { name: string; prs: number }[];

  reviewsGiven: number;
  reviewsReceived: number;
  avgReviewResponseTime: number;
  fastestReview: number; // in hours
  slowestReview: number; // in hours

  repoPerformance: {
    name: string;
    totalPRs: number;
    mergeRate: number;
    reviewCount: number;
    avgReviewTime: number;
  }[];

  highlights: {
    mostDiscussed?: { title: string; url: string; comments: number };
    fastestMerged?: { title: string; url: string; time: number }; // time in hours
    largest?: { title: string; url: string; additions: number; deletions: number };
  };
  prs: { title: string; url: string; state: string; createdAt: string; repo: string }[];
}

const prInsightsCache = new DistributedCache<PRInsightData>(500);

let currentTokenIndex = 0;
function getHeaders(userToken?: string) {
  let token = userToken;
  if (!token) {
    const tokens = getGitHubTokens();
    if (tokens.length === 0) throw new Error('GitHub token is missing');
    token = tokens[currentTokenIndex % tokens.length];
    currentTokenIndex++;
  }
  return {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchPRInsights(
  username: string,
  userToken?: string,
  signal?: AbortSignal
): Promise<PRInsightData> {
  const cacheKey = `pr-insights:${username.toLowerCase()}`;
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

  return prInsightsCache.getOrSet(
    cacheKey,
    async () => {
      return fetchPRInsightsUncached(username, userToken, signal);
    },
    CACHE_TTL_MS
  );
}

async function fetchPRInsightsUncached(
  username: string,
  userToken?: string,
  signal?: AbortSignal
): Promise<PRInsightData> {
  // We use the GraphQL search API to get PRs authored by the user and PRs reviewed by the user.
  // This is more efficient than iterating through user.pullRequests.

  const query = `
    query($authorQuery: String!, $reviewerQuery: String!, $after: String) {
      authored: search(query: $authorQuery, type: ISSUE, first: 100, after: $after) {
        nodes {
          ... on PullRequest {
            id
            title
            url
            state
            createdAt
            closedAt
            mergedAt
            additions
            deletions
            repository {
              nameWithOwner
            }
            comments {
              totalCount
            }
            reviews(first: 100) {
              nodes {
                author { login }
                createdAt
                state
              }
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      reviewed: search(query: $reviewerQuery, type: ISSUE, first: 100) {
        issueCount
      }
    }
  `;

  // Get PRs from the last year to keep payload reasonable
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateStr = oneYearAgo.toISOString().split('T')[0];

  const variables = {
    authorQuery: `is:pr author:${username} created:>=${dateStr}`,
    reviewerQuery: `is:pr reviewed-by:${username} -author:${username} created:>=${dateStr}`,
  };

  let allAuthoredPRs: PRNode[] = [];
  let hasNextPage = true;
  let after: string | null = null;
  let reviewsGivenCount = 0;
  for (let page = 0; page < MAX_PAGES && hasNextPage; page++) {
    const res = await fetchWithRetry(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: getHeaders(userToken),
      body: JSON.stringify({ query, variables: { ...variables, after } }),
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch PR insights: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0]?.message || 'GraphQL Error');
    }

    const pageNodes = (json.data?.authored?.nodes || []).filter((n: PRNode) => n && n.title);
    allAuthoredPRs = allAuthoredPRs.concat(pageNodes);

    hasNextPage = json.data?.authored?.pageInfo?.hasNextPage || false;
    after = json.data?.authored?.pageInfo?.endCursor || null;

    if (page === 0) {
      reviewsGivenCount = json.data?.reviewed?.issueCount || 0;
    }
  }

  const authoredPRs = allAuthoredPRs;

  // Process data
  const totalPRs = authoredPRs.length;
  let openPRs = 0;
  let mergedPRs = 0;
  let closedPRs = 0;

  const cycleTimes: number[] = [];
  const reviewTimes: number[] = [];
  const firstReviewTimes: number[] = [];

  let reviewsReceived = 0;
  let fastestReview = Infinity;
  let slowestReview = 0;

  const repoMap = new Map<
    string,
    { total: number; merged: number; reviewCount: number; reviewTimeSum: number }
  >();

  let mostDiscussed = { title: '', url: '', comments: -1 };
  let fastestMerged = { title: '', url: '', time: Infinity };
  let largest = { title: '', url: '', additions: -1, deletions: 0 };

  const weeklyActivityMap = new Map<string, number>();
  const monthlyActivityMap = new Map<string, number>();

  for (const pr of authoredPRs) {
    // Basic stats
    if (pr.state === 'OPEN') openPRs++;
    else if (pr.state === 'MERGED') mergedPRs++;
    else closedPRs++;

    // Activity timelines
    const createdDate = new Date(pr.createdAt);

    // Group by month
    const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyActivityMap.set(monthKey, (monthlyActivityMap.get(monthKey) || 0) + 1);

    // Group by week (ISO week roughly)
    const weekKey = getWeekKey(createdDate);
    weeklyActivityMap.set(weekKey, (weeklyActivityMap.get(weekKey) || 0) + 1);

    // Repos
    const repoName = pr.repository?.nameWithOwner || 'Unknown';
    if (!repoMap.has(repoName)) {
      repoMap.set(repoName, { total: 0, merged: 0, reviewCount: 0, reviewTimeSum: 0 });
    }
    const repoStats = repoMap.get(repoName)!;
    repoStats.total++;
    if (pr.state === 'MERGED') repoStats.merged++;

    // Cycle time (Merged - Created)
    if (pr.mergedAt) {
      const mergedDate = new Date(pr.mergedAt);
      const hours = (mergedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      cycleTimes.push(hours);

      if (hours < fastestMerged.time) {
        fastestMerged = { title: pr.title, url: pr.url, time: hours };
      }
    }

    // Size
    if (pr.additions + pr.deletions > largest.additions + largest.deletions) {
      largest = { title: pr.title, url: pr.url, additions: pr.additions, deletions: pr.deletions };
    }

    // Comments
    if (pr.comments !== null && (pr.comments?.totalCount ?? 0) > mostDiscussed.comments) {
      mostDiscussed = { title: pr.title, url: pr.url, comments: pr.comments.totalCount };
    }

    // Reviews - use totalCount for accurate count, nodes for timing analysis
    const reviews = pr.reviews?.nodes || [];
    const totalReviewCount = pr.reviews?.totalCount || reviews.length;
    const prReviewTimes: number[] = [];

    // Use totalCount for accurate reviewsReceived (accounts for reviews beyond first 100)
    reviewsReceived += totalReviewCount;
    repoStats.reviewCount += totalReviewCount;

    // Analyze timing from available nodes (first 100 reviews)
    for (const review of reviews) {
      if (review.author?.login === username) continue; // skip self reviews

      const reviewDate = new Date(review.createdAt);
      const diffHours = (reviewDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

      prReviewTimes.push(diffHours);
      reviewTimes.push(diffHours);
      repoStats.reviewTimeSum += diffHours;

      if (diffHours < fastestReview) fastestReview = diffHours;
      if (diffHours > slowestReview) slowestReview = diffHours;
    }

    if (prReviewTimes.length > 0) {
      firstReviewTimes.push(Math.min(...prReviewTimes));
    }
  }

  // Calculate averages
  const mergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;
  const avgCycleTime =
    cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0;
  const avgReviewTime =
    reviewTimes.length > 0 ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length : 0;
  const avgTimeToFirstReview =
    firstReviewTimes.length > 0
      ? firstReviewTimes.reduce((a, b) => a + b, 0) / firstReviewTimes.length
      : 0;

  // Format activity
  const weeklyActivity = Array.from(weeklyActivityMap.entries())
    .map(([name, prs]) => ({ name, prs }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-12); // last 12 weeks

  const monthlyActivity = Array.from(monthlyActivityMap.entries())
    .map(([name, prs]) => ({ name, prs }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-12); // last 12 months

  // Format Repo Performance
  const repoPerformance = Array.from(repoMap.entries())
    .map(([name, stats]) => ({
      name,
      totalPRs: stats.total,
      mergeRate: stats.total > 0 ? (stats.merged / stats.total) * 100 : 0,
      reviewCount: stats.reviewCount,
      avgReviewTime: stats.reviewCount > 0 ? stats.reviewTimeSum / stats.reviewCount : 0,
    }))
    .sort((a, b) => b.totalPRs - a.totalPRs)
    .slice(0, 10);

  return {
    totalPRs,
    openPRs,
    mergedPRs,
    closedPRs,
    mergeRate,
    avgReviewTime,
    avgTimeToFirstReview,
    avgCycleTime,
    weeklyActivity,
    monthlyActivity,
    reviewsGiven: reviewsGivenCount,
    reviewsReceived,
    avgReviewResponseTime: avgReviewTime, // using same metric for now
    fastestReview: fastestReview === Infinity ? 0 : fastestReview,
    slowestReview,
    repoPerformance,
    highlights: {
      mostDiscussed: mostDiscussed.comments >= 0 ? mostDiscussed : undefined,
      fastestMerged: fastestMerged.time !== Infinity ? fastestMerged : undefined,
      largest: largest.additions >= 0 ? largest : undefined,
    },
    prs: authoredPRs.map((pr) => ({
      title: pr.title,
      url: pr.url,
      state: pr.state,
      createdAt: pr.createdAt,
      repo: pr.repository?.nameWithOwner ?? 'Unknown',
    })),
  };
}

function getWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
