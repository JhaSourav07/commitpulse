import { fetchWithRetry, getGitHubTokens } from '@/lib/github';
import { DistributedCache } from '@/lib/cache';
import type {
  CIAnalyticsData,
  CIWorkflowRun,
  CIWorkflow,
  CIRepoHealth,
  CIInsights,
  CIDailyTrend,
  CIWeeklyTrend,
  CIMonthlyTrend,
} from '@/types/ci-analytics';

const GITHUB_REST_URL = 'https://api.github.com';

const cache = new DistributedCache<CIAnalyticsData>(500);

let currentTokenIndex = 0;

function getHeaders() {
  const tokens = getGitHubTokens();
  if (tokens.length === 0) throw new Error('GitHub token is missing');
  const token = tokens[currentTokenIndex % tokens.length];
  currentTokenIndex++;
  return {
    Authorization: `bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

async function fetchAllPages<T>(url: string, perPage = 100): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 3) {
    const paginatedUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=${perPage}&page=${page}`;
    const res = await fetchWithRetry(paginatedUrl, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
    } else {
      results.push(...data);
      page++;
    }
  }

  return results;
}

interface RepoInfo {
  name: string;
  owner: string;
  fork: boolean;
  parent?: { owner: { login: string }; name: string };
}

async function fetchUserRepos(username: string): Promise<RepoInfo[]> {
  const repos = await fetchAllPages<{
    name: string;
    owner: { login: string };
    fork: boolean;
    parent?: { owner: { login: string }; name: string };
  }>(`${GITHUB_REST_URL}/users/${encodeURIComponent(username)}/repos?sort=pushed`);
  return repos.map((r) => ({
    name: r.name,
    owner: r.owner.login,
    fork: r.fork,
    parent: r.parent ? { owner: { login: r.parent.owner.login }, name: r.parent.name } : undefined,
  }));
}

async function fetchActionsPages<T>(url: string, dataField: string, perPage = 50): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= 3) {
    const paginatedUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=${perPage}&page=${page}`;
    const res = await fetchWithRetry(paginatedUrl, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) break;
    const body = await res.json();
    const items = body[dataField];
    if (!Array.isArray(items) || items.length === 0) break;
    results.push(...items);
    page++;
  }

  return results;
}

async function fetchWorkflowRuns(
  owner: string,
  repo: string,
  label?: string
): Promise<{
  runs: CIWorkflowRun[];
  workflows: CIWorkflow[];
  branches: Set<string>;
}> {
  const displayName = label || `${owner}/${repo}`;
  const runsUrl = `${GITHUB_REST_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs`;
  const workflowsUrl = `${GITHUB_REST_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows`;

  const [runsData, workflowsData] = await Promise.allSettled([
    fetchActionsPages<{
      id: number;
      name: string;
      head_branch: string;
      status: string;
      conclusion: string | null;
      created_at: string;
      updated_at: string;
      run_started_at: string | null;
      event: string;
      html_url: string;
      run_duration_ms?: number;
    }>(runsUrl, 'workflow_runs', 50),
    fetchActionsPages<{
      id: number;
      name: string;
      state: string;
    }>(workflowsUrl, 'workflows'),
  ]);

  const branches = new Set<string>();
  const workflows: CIWorkflow[] = [];

  if (workflowsData.status === 'fulfilled') {
    for (const wf of workflowsData.value) {
      workflows.push({
        id: wf.id,
        name: wf.name,
        repository: displayName,
        state: wf.state,
      });
    }
  }

  const runs: CIWorkflowRun[] = [];

  if (runsData.status === 'fulfilled') {
    for (const run of runsData.value) {
      if (run.head_branch) branches.add(run.head_branch);

      const startedAt = run.run_started_at || run.created_at;
      const finishedAt = run.updated_at;
      const durationMs = run.run_duration_ms || 0;
      const duration =
        durationMs > 0
          ? Math.round(durationMs / 1000)
          : calculateDurationFallback(startedAt, finishedAt);

      runs.push({
        id: run.id,
        name: run.name,
        repository: displayName,
        branch: run.head_branch,
        status: run.status,
        conclusion: run.conclusion,
        duration,
        triggerEvent: run.event,
        startedAt,
        finishedAt: run.conclusion ? finishedAt : null,
        url: run.html_url,
      });
    }
  }

  return { runs, workflows, branches };
}

function calculateDurationFallback(startedAt: string, finishedAt: string): number {
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    return Math.max(0, Math.round((end - start) / 1000));
  } catch {
    return 0;
  }
}

function processRuns(runs: CIWorkflowRun[]) {
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.conclusion === 'success').length;
  const failedRuns = runs.filter((r) => r.conclusion === 'failure').length;
  const cancelledRuns = runs.filter((r) => r.conclusion === 'cancelled').length;
  const inProgressRuns = runs.filter(
    (r) =>
      r.status === 'in_progress' ||
      r.status === 'queued' ||
      r.status === 'pending' ||
      r.status === 'waiting'
  ).length;
  const successRate =
    totalRuns > 0 ? Math.round((successfulRuns / (successfulRuns + failedRuns)) * 100) : 0;

  const completedRuns = runs.filter((r) => r.conclusion !== null);
  const totalDuration = completedRuns.reduce((sum, r) => sum + r.duration, 0);
  const avgBuildDuration =
    completedRuns.length > 0 ? Math.round(totalDuration / completedRuns.length) : 0;

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    cancelledRuns,
    inProgressRuns,
    successRate,
    avgBuildDuration,
  };
}

function buildStatusBreakdown(runs: CIWorkflowRun[]) {
  return {
    success: runs.filter((r) => r.conclusion === 'success').length,
    failed: runs.filter((r) => r.conclusion === 'failure').length,
    cancelled: runs.filter((r) => r.conclusion === 'cancelled').length,
    inProgress: runs.filter(
      (r) =>
        r.status === 'in_progress' ||
        r.status === 'queued' ||
        r.status === 'pending' ||
        r.status === 'waiting'
    ).length,
  };
}

function buildDailyTrend(runs: CIWorkflowRun[]): CIDailyTrend[] {
  const map = new Map<string, number>();
  for (const run of runs) {
    const day = new Date(run.startedAt).toISOString().slice(0, 10);
    map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, runs: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

function buildWeeklyTrend(runs: CIWorkflowRun[]): CIWeeklyTrend[] {
  const map = new Map<string, number>();
  for (const run of runs) {
    const d = new Date(run.startedAt);
    const dayOfWeek = d.getUTCDay();
    const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    const week = monday.toISOString().slice(0, 10);
    map.set(week, (map.get(week) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([week, count]) => ({ week, runs: count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);
}

function buildMonthlyTrend(runs: CIWorkflowRun[]): CIMonthlyTrend[] {
  const map = new Map<string, number>();
  for (const run of runs) {
    const month = run.startedAt.slice(0, 7);
    map.set(month, (map.get(month) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, runs: count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}

function buildRepoHealth(runs: CIWorkflowRun[]): CIRepoHealth[] {
  const repoMap = new Map<
    string,
    { success: number; total: number; duration: number; lastRun: CIWorkflowRun | null }
  >();

  for (const run of runs) {
    if (!repoMap.has(run.repository)) {
      repoMap.set(run.repository, { success: 0, total: 0, duration: 0, lastRun: null });
    }
    const entry = repoMap.get(run.repository)!;
    entry.total++;
    if (run.conclusion === 'success') entry.success++;
    if (run.duration > 0) entry.duration += run.duration;
    if (!entry.lastRun || run.startedAt > entry.lastRun.startedAt) {
      entry.lastRun = run;
    }
  }

  return Array.from(repoMap.entries())
    .map(([name, stats]) => ({
      name,
      successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      totalRuns: stats.total,
      avgDuration: stats.total > 0 ? Math.round(stats.duration / stats.total) : 0,
      lastRunStatus: stats.lastRun?.conclusion || stats.lastRun?.status || 'unknown',
    }))
    .sort((a, b) => b.successRate - a.successRate);
}

function buildInsights(runs: CIWorkflowRun[]): CIInsights {
  const completedRuns = runs.filter((r) => r.conclusion !== null && r.duration > 0);

  let fastestRun = completedRuns.length > 0 ? completedRuns[0] : null;
  let slowestRun = completedRuns.length > 0 ? completedRuns[0] : null;

  for (const run of completedRuns) {
    if (run.duration < (fastestRun?.duration || Infinity)) fastestRun = run;
    if (run.duration > (slowestRun?.duration || 0)) slowestRun = run;
  }

  const repoRunCount = new Map<string, number>();
  const failedWorkflowCount = new Map<string, number>();
  const repoSuccessRate = new Map<string, { success: number; total: number }>();

  for (const run of runs) {
    repoRunCount.set(run.repository, (repoRunCount.get(run.repository) || 0) + 1);

    if (run.conclusion === 'failure') {
      failedWorkflowCount.set(run.name, (failedWorkflowCount.get(run.name) || 0) + 1);
    }

    if (!repoSuccessRate.has(run.repository)) {
      repoSuccessRate.set(run.repository, { success: 0, total: 0 });
    }
    const entry = repoSuccessRate.get(run.repository)!;
    entry.total++;
    if (run.conclusion === 'success') entry.success++;
  }

  const mostActiveRepo = Array.from(repoRunCount.entries()).sort((a, b) => b[1] - a[1])[0];
  const mostFailedWorkflow = Array.from(failedWorkflowCount.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const highestSuccessRepo = Array.from(repoSuccessRate.entries())
    .map(([name, rate]) => ({ name, rate: rate.total > 0 ? rate.success / rate.total : 0 }))
    .sort((a, b) => b.rate - a.rate)[0];

  return {
    fastestWorkflow: fastestRun?.name || 'N/A',
    fastestDuration: fastestRun?.duration || 0,
    slowestWorkflow: slowestRun?.name || 'N/A',
    slowestDuration: slowestRun?.duration || 0,
    mostActiveRepo: mostActiveRepo?.[0] || 'N/A',
    mostActiveRepoRuns: mostActiveRepo?.[1] || 0,
    mostFailedWorkflow: mostFailedWorkflow?.[0] || 'N/A',
    mostFailedCount: mostFailedWorkflow?.[1] || 0,
    highestSuccessRepo: highestSuccessRepo?.name || 'N/A',
    highestSuccessRate: highestSuccessRepo ? Math.round(highestSuccessRepo.rate * 100) : 0,
  };
}

export async function fetchCIAnalytics(username: string): Promise<CIAnalyticsData> {
  const cacheKey = `ci-analytics:${username.toLowerCase()}`;
  const CACHE_TTL_MS = 10 * 60 * 1000;

  return cache.getOrSet(cacheKey, async () => fetchCIAnalyticsUncached(username), CACHE_TTL_MS);
}

async function fetchCIAnalyticsUncached(username: string): Promise<CIAnalyticsData> {
  const repos = await fetchUserRepos(username);

  if (repos.length === 0) {
    return buildEmptyData();
  }

  const allRuns: CIWorkflowRun[] = [];
  const allWorkflows: CIWorkflow[] = [];
  const allBranches = new Set<string>();

  const fetchTargets: { owner: string; repo: string; label: string }[] = [];

  for (const repo of repos.slice(0, 10)) {
    fetchTargets.push({ owner: repo.owner, repo: repo.name, label: `${repo.owner}/${repo.name}` });
    if (repo.fork && repo.parent) {
      const parentLabel = `${repo.parent.owner.login}/${repo.parent.name}`;
      if (!fetchTargets.some((t) => t.label === parentLabel)) {
        fetchTargets.push({
          owner: repo.parent.owner.login,
          repo: repo.parent.name,
          label: parentLabel,
        });
      }
    }
  }

  const results = await Promise.allSettled(
    fetchTargets.map((t) => fetchWorkflowRuns(t.owner, t.repo, t.label))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allRuns.push(...result.value.runs);
      allWorkflows.push(...result.value.workflows);
      for (const branch of result.value.branches) {
        allBranches.add(branch);
      }
    }
  }

  const latestRuns = allRuns
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 50);

  const { totalRuns, successfulRuns, failedRuns, cancelledRuns, successRate, avgBuildDuration } =
    processRuns(allRuns);

  const stats: CIAnalyticsData = {
    totalRuns,
    successfulRuns,
    failedRuns,
    cancelledRuns,
    successRate,
    avgBuildDuration,

    statusBreakdown: buildStatusBreakdown(allRuns),
    dailyTrend: buildDailyTrend(allRuns),
    weeklyTrend: buildWeeklyTrend(allRuns),
    monthlyTrend: buildMonthlyTrend(allRuns),

    recentRuns: latestRuns,
    repoHealth: buildRepoHealth(allRuns),
    insights: buildInsights(allRuns),

    workflows: allWorkflows,
    repos: repos.map((r) => r.name).slice(0, 10),
    branches: Array.from(allBranches).sort(),
  };

  return stats;
}

function buildEmptyData(): CIAnalyticsData {
  return {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    cancelledRuns: 0,
    successRate: 0,
    avgBuildDuration: 0,
    statusBreakdown: { success: 0, failed: 0, cancelled: 0, inProgress: 0 },
    dailyTrend: [],
    weeklyTrend: [],
    monthlyTrend: [],
    recentRuns: [],
    repoHealth: [],
    insights: {
      fastestWorkflow: 'N/A',
      fastestDuration: 0,
      slowestWorkflow: 'N/A',
      slowestDuration: 0,
      mostActiveRepo: 'N/A',
      mostActiveRepoRuns: 0,
      mostFailedWorkflow: 'N/A',
      mostFailedCount: 0,
      highestSuccessRepo: 'N/A',
      highestSuccessRate: 0,
    },
    workflows: [],
    repos: [],
    branches: [],
  };
}
