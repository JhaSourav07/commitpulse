// lib/github.ts

import type { ContributionCalendar } from "../types";

const GITHUB_API_URL = 'https://api.github.com/graphql';

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
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
    // We handle caching at the Next.js Route level, so we bypass the internal fetch cache
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GitHub API returned status ${res.status}`);
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
