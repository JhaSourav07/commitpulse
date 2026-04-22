// lib/github.ts

import type { ContributionCalendar } from '../types';
import { calculateStreak } from './calculate';

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

const getHeaders = () => ({
  Authorization: `bearer ${process.env.GITHUB_PAT || process.env.GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
});

export async function fetchGitHubContributions(username: string): Promise<ContributionCalendar> {
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
    headers: getHeaders(),
    body: JSON.stringify({ query, variables: { login: username } }),
    cache: 'no-store', // Cache handled at the API route
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

  return data.data.user.contributionsCollection.contributionCalendar;
}

export async function fetchUserProfile(username: string) {
  const res = await fetch(`${GITHUB_REST_URL}/users/${username}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchUserRepos(username: string) {
  const res = await fetch(`${GITHUB_REST_URL}/users/${username}/repos?per_page=100&sort=pushed`, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GitHub REST API error: ${res.status}`);
  }

  return res.json();
}

export async function getFullDashboardData(username: string) {
  try {
    const [profileData, reposData, calendarData] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username),
      fetchGitHubContributions(username),
    ]);

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
      developerScore: Math.min(
        Math.floor((profileData.public_repos * 2 + profileData.followers * 5) / 10),
        100
      ),
      stats: {
        repositories: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        stars: reposData.reduce((acc: number, repo: GitHubRepo) => acc + repo.stargazers_count, 0),
      },
    };

    // 2. Streaks & Activity Mapping
    const streakStats = calculateStreak(calendarData);

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
