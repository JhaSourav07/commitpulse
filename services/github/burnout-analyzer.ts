import { getGitHubTokens } from '@/lib/github';
import { DistributedCache } from '@/lib/cache';

const GITHUB_REST_URL = 'https://api.github.com';

export interface ContributorMetric {
  username: string;
  avatarUrl: string;
  totalCommits: number;
  commitShare: number; // percentage
  burnoutScore: number; // 0 - 100
  riskLevel: 'Low' | 'Medium' | 'High';
  activeWeeks: number;
  highIntensityWeeks: number;
  consecutiveHighWeeks: number;
  restWeeks: number; // last 12 weeks with 0 commits
  recentTrend: number[]; // commits per week for last 12 weeks
  recentAdditionsTrend: number[]; // additions per week for last 12 weeks
}

export interface BurnoutReport {
  repoName: string;
  totalCommits: number;
  totalContributors: number;
  busFactor: number;
  dependencyRisk: 'Low' | 'Medium' | 'High';
  sustainabilityScore: number; // 0 - 100
  contributors: ContributorMetric[];
  inactivityAlerts: {
    username: string;
    avatarUrl: string;
    previousAvgWeeklyCommits: number;
    weeksSilent: number;
    severity: 'Medium' | 'High';
  }[];
  recommendations: string[];
}

const reportCache = new DistributedCache<BurnoutReport>(200);

let currentTokenIndex = 0;
function getHeaders() {
  const tokens = getGitHubTokens();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  if (tokens.length > 0) {
    const token = tokens[currentTokenIndex % tokens.length];
    currentTokenIndex++;
    headers['Authorization'] = `bearer ${token}`;
  }
  return headers;
}

export async function fetchBurnoutAnalysis(
  owner: string,
  repo: string,
  options: { bypassCache?: boolean } = {}
): Promise<BurnoutReport> {
  const cacheKey = `burnout-analyzer:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

  if (options.bypassCache) {
    const fresh = await analyzeRepositoryUncached(owner, repo);
    await reportCache.set(cacheKey, fresh, CACHE_TTL_MS);
    return fresh;
  }

  return reportCache.getOrSet(
    cacheKey,
    async () => {
      return analyzeRepositoryUncached(owner, repo);
    },
    CACHE_TTL_MS
  );
}

// GitHub stats endpoints can return 202 if compiling. We need a helper with retry support.
async function fetchStatsWithCompilingRetry(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  let attempts = 0;
  const maxAttempts = 3;
  let delay = 1500;

  while (attempts < maxAttempts) {
    let res: Response;
    try {
      res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    } catch (err) {
      if (attempts >= maxAttempts - 1) throw err;
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }

    if (res.status === 202) {
      // GitHub is compiling stats, wait and retry
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }
    return res;
  }
  throw new Error('GitHub is still compiling statistics. Please try again in a few moments.');
}

async function analyzeRepositoryUncached(owner: string, repo: string): Promise<BurnoutReport> {
  const url = `${GITHUB_REST_URL}/repos/${owner}/${repo}/stats/contributors`;
  const headers = getHeaders();

  const res = await fetchStatsWithCompilingRetry(url, headers);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found.`);
    }
    throw new Error(`Failed to fetch contributor stats: ${res.statusText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData: any[] = await res.json();
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('No contribution data found for this repository.');
  }

  const totalCommits = rawData.reduce((acc, c) => acc + (c.total || 0), 0);
  const totalContributors = rawData.length;

  // 1. Process contributor metrics
  const contributors: ContributorMetric[] = [];
  const inactivityAlerts: BurnoutReport['inactivityAlerts'] = [];

  // Sort contributors by total commits descending

  const sortedRaw = [...rawData].sort((a, b) => (b.total || 0) - (a.total || 0));

  for (const c of sortedRaw) {
    if (!c.author || !c.weeks || c.weeks.length === 0) continue;

    const username = c.author.login;
    const avatarUrl = c.author.avatar_url;
    const userCommits = c.total || 0;
    const commitShare = totalCommits > 0 ? (userCommits / totalCommits) * 100 : 0;

    // Get the last 12 weeks of contributions

    const recentWeeks = c.weeks.slice(-12);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentTrend = recentWeeks.map((w: any) => w.c || 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentAdditionsTrend = recentWeeks.map((w: any) => w.a || 0);

    // Calculate metrics over last 12 weeks
    let activeWeeks = 0;
    let highIntensityWeeks = 0;
    let currentConsecutiveHigh = 0;
    let maxConsecutiveHigh = 0;
    let restWeeks = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentWeeks.forEach((w: any) => {
      const commits = w.c || 0;
      const additions = w.a || 0;

      if (commits > 0) {
        activeWeeks++;
      } else {
        restWeeks++;
      }

      // High intensity defined as > 8 commits OR > 750 additions in a single week
      const isHighIntensity = commits > 8 || additions > 750;
      if (isHighIntensity) {
        highIntensityWeeks++;
        currentConsecutiveHigh++;
        if (currentConsecutiveHigh > maxConsecutiveHigh) {
          maxConsecutiveHigh = currentConsecutiveHigh;
        }
      } else {
        currentConsecutiveHigh = 0;
      }
    });

    // Calculate burnout risk score
    // - Consecutive high-intensity weeks weigh heavily
    // - Total high-intensity weeks add to score
    // - Rest weeks reduce the score
    let burnoutScore = maxConsecutiveHigh * 15 + highIntensityWeeks * 6 - restWeeks * 4;

    // Workload spike check: average of last 3 weeks vs preceding 6 weeks
    const last3WeeksCommits = recentTrend.slice(-3).reduce((a: number, b: number) => a + b, 0);
    const preceding6WeeksCommits = recentTrend
      .slice(-9, -3)
      .reduce((a: number, b: number) => a + b, 0);

    const avgLast3 = last3WeeksCommits / 3;
    const avgPreceding6 = preceding6WeeksCommits / 6;

    if (avgPreceding6 > 0 && avgLast3 > avgPreceding6 * 1.5) {
      // Burnout score increases if they have a sudden surge of commits
      burnoutScore += 15;
    }

    // Workload concentration factor: if they carry a massive share, they have higher burnout risk
    burnoutScore += commitShare * 0.4;

    // Clamp score 0 - 100
    burnoutScore = Math.max(0, Math.min(100, Math.round(burnoutScore)));

    const riskLevel = burnoutScore > 70 ? 'High' : burnoutScore > 35 ? 'Medium' : 'Low';

    contributors.push({
      username,
      avatarUrl,
      totalCommits: userCommits,
      commitShare: Math.round(commitShare * 100) / 100,
      burnoutScore,
      riskLevel,
      activeWeeks,
      highIntensityWeeks,
      consecutiveHighWeeks: maxConsecutiveHigh,
      restWeeks,
      recentTrend,
      recentAdditionsTrend,
    });

    // 2. Check for sudden inactivity
    // User must have been active previously (average > 1 commit/week in the first 9 weeks of the 12-week block)
    // And completely inactive in the last 3 weeks (0 commits)
    const historyWeeks = recentTrend.slice(0, 9);
    const recent3Weeks = recentTrend.slice(-3);
    const avgHistory = historyWeeks.reduce((a: number, b: number) => a + b, 0) / 9;
    const commitsRecent3 = recent3Weeks.reduce((a: number, b: number) => a + b, 0);

    if (avgHistory > 1 && commitsRecent3 === 0) {
      let weeksSilent = 0;
      for (let i = recentTrend.length - 1; i >= 0; i--) {
        if (recentTrend[i] === 0) {
          weeksSilent++;
        } else {
          break;
        }
      }

      inactivityAlerts.push({
        username,
        avatarUrl,
        previousAvgWeeklyCommits: Math.round(avgHistory * 10) / 10,
        weeksSilent,
        severity: avgHistory > 3 ? 'High' : 'Medium',
      });
    }
  }

  // 3. Compute Bus Factor (Dependency Risk)
  // Number of top contributors who combined represent > 70% of total commits
  let runningCommits = 0;
  let busFactor = 0;
  for (const c of contributors) {
    runningCommits += c.totalCommits;
    busFactor++;
    if (runningCommits / totalCommits >= 0.7) {
      break;
    }
  }

  const dependencyRisk = busFactor === 1 ? 'High' : busFactor <= 3 ? 'Medium' : 'Low';

  // 4. Compute overall Team Sustainability Score
  // Factors:
  // - Dependency risk (high risk drops score by 35, medium by 15)
  // - Ratio of contributors with High Burnout scores (more high burnout = lower sustainability)
  // - Ratio of inactive/churned contributors
  let sustainabilityScore = 100;
  if (dependencyRisk === 'High') sustainabilityScore -= 30;
  else if (dependencyRisk === 'Medium') sustainabilityScore -= 12;

  const highBurnoutCount = contributors.filter((c) => c.riskLevel === 'High').length;
  const mediumBurnoutCount = contributors.filter((c) => c.riskLevel === 'Medium').length;

  if (totalContributors > 0) {
    const burnoutPenalty =
      (highBurnoutCount / totalContributors) * 50 + (mediumBurnoutCount / totalContributors) * 15;
    sustainabilityScore -= burnoutPenalty;
  }

  const highInactivityCount = inactivityAlerts.filter((a) => a.severity === 'High').length;
  sustainabilityScore -= highInactivityCount * 8;

  sustainabilityScore = Math.max(0, Math.min(100, Math.round(sustainabilityScore)));

  // 5. Generate recommendations
  const recommendations: string[] = [];

  // Dependency recommendations
  if (dependencyRisk === 'High' && contributors[0]) {
    recommendations.push(
      `High dependency risk detected: @${contributors[0].username} is responsible for ${contributors[0].commitShare}% of all commits. Rotate tasks and onboard other team members to safeguard the repository's future.`
    );
  } else if (dependencyRisk === 'Medium' && contributors.length >= 2) {
    recommendations.push(
      `Moderate dependency risk: The top contributors (@${contributors[0]?.username} and @${contributors[1]?.username}) drive the majority of changes. Consider document sharing to bridge technical silos.`
    );
  }

  // Burnout recommendations
  const highlyStressed = contributors.filter((c) => c.riskLevel === 'High').slice(0, 2);
  highlyStressed.forEach((c) => {
    recommendations.push(
      `Burnout risk warning: @${c.username} has worked for ${c.consecutiveHighWeeks} consecutive high-intensity weeks with almost no resting periods. Encourage them to take a rest week to avoid exhaustion.`
    );
  });

  // Inactivity alerts recommendations
  if (inactivityAlerts.length > 0) {
    const targetAlerts = inactivityAlerts.slice(0, 2);
    targetAlerts.forEach((a) => {
      recommendations.push(
        `Activity drop detected: @${a.username} (previously averaging ${a.previousAvgWeeklyCommits} commits/week) has been silent for ${a.weeksSilent} weeks. Check in with them to see if they need assistance or block removal.`
      );
    });
  }

  // General healthy recommendations
  if (sustainabilityScore > 85) {
    recommendations.push(
      'Healthy contribution patterns detected! The workload is well-distributed and contributors have sustainable activity levels.'
    );
  } else if (recommendations.length === 0) {
    recommendations.push(
      'Plan regular cooldown periods or refactoring weeks between feature releases to help the team balance workloads.'
    );
  }

  // Optional: If Gemini API is configured, call it here to generate/improve recommendations
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const improvedRecs = await generateRecommendationsWithGemini(
        geminiApiKey,
        owner,
        repo,
        totalCommits,
        totalContributors,
        busFactor,
        dependencyRisk,
        sustainabilityScore,
        contributors.slice(0, 5),
        inactivityAlerts
      );
      if (improvedRecs && improvedRecs.length > 0) {
        // Prepend AI recommendations
        recommendations.unshift(...improvedRecs);
      }
    } catch (err) {
      console.warn(
        'Gemini recommendation generation failed. Falling back to rules-based analyzer.',
        err
      );
    }
  }

  return {
    repoName: `${owner}/${repo}`,
    totalCommits,
    totalContributors,
    busFactor,
    dependencyRisk,
    sustainabilityScore,
    contributors,
    inactivityAlerts,
    recommendations,
  };
}

async function generateRecommendationsWithGemini(
  apiKey: string,
  owner: string,
  repo: string,
  totalCommits: number,
  totalContributors: number,
  busFactor: number,
  dependencyRisk: string,
  sustainabilityScore: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topContributors: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inactivityAlerts: any[]
): Promise<string[]> {
  const prompt = `
  You are an expert AI repository consultant. Analyze these contributor metrics for GitHub repository ${owner}/${repo}:
  - Total Commits: ${totalCommits}
  - Total Contributors: ${totalContributors}
  - Bus Factor: ${busFactor}
  - Repository Dependency Risk: ${dependencyRisk}
  - Overall Team Sustainability Score: ${sustainabilityScore}/100
  
  Top Contributor Workload Breakdown:
  ${topContributors.map((c) => `- @${c.username}: ${c.commitShare}% share, Burnout Score: ${c.burnoutScore}/100 (Risk: ${c.riskLevel}), Consecutive intense weeks: ${c.consecutiveHighWeeks}`).join('\n')}
  
  Recent Attrition/Inactivity Warnings:
  ${inactivityAlerts.map((a) => `- @${a.username}: silent for ${a.weeksSilent} weeks (previously averaged ${a.previousAvgWeeklyCommits} commits/week)`).join('\n')}
  
  Generate exactly 2 high-value, specific, actionable advice/recommendations (each under 25 words) for the project maintainers to improve developer retention, balance workload, and mitigate burnout.
  Return them as a JSON string array like: ["recommendation 1", "recommendation 2"]
  Do not return any markdown formatting outside of JSON, do not include HTML tags, and do not wrap in a code block.
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => `[AI Recommendation] ${item}`);
    }
  }
  return [];
}
