// lib/github.ts

const GITHUB_API_URL = 'https://api.github.com/graphql';

export async function fetchGitHubContributions(username: string) {
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

  const data = await res.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data.data.user.contributionsCollection.contributionCalendar;
}
