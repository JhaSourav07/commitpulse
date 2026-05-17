

const GITHUB_API_URL = 'https://api.github.com/graphql';


const token = process.env.GITHUB_PAT;

if (!token) {
  throw new Error(
    '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  Missing environment variable: GITHUB_PAT\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  1. Copy the template:  cp .env.example .env.local\n' +
    '  2. Open .env.local\n' +
    '  3. Set GITHUB_PAT=ghp_your_token_here\n' +
    '  4. Generate a token: https://github.com/settings/tokens/new\n' +
    '     (Only "read:user" scope required)\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  );
}

const CONTRIBUTIONS_QUERY = (
  username: string,
  from: string,
  to: string
) => `
  query {
    user(login: "${username}") {
      contributionsCollection(from: "${from}", to: "${to}") {
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

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface GitHubContributionsResponse {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
      };
    } | null;
  };
  errors?: { message: string }[];
}

export async function fetchContributions(
  username: string,
  from: string,
  to: string
): Promise<ContributionCalendar> {
  const res = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CommitPulse/1.0',
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY(username, from, to),
    }),
    cache: 'no-store',
  });

  const remaining = parseInt(
    res.headers.get('X-RateLimit-Remaining') ?? '1',
    10
  );
  const resetAt = parseInt(
    res.headers.get('X-RateLimit-Reset') ?? '0',
    10
  );

  if (res.status === 403 || res.status === 429 || remaining === 0) {
    const resetDate = new Date(resetAt * 1000).toUTCString();
    throw new RateLimitError(
      `GitHub API rate limit exhausted. Resets at ${resetDate}.`,
      resetAt
    );
  }

  if (!res.ok) {
    throw new Error(
      `GitHub GraphQL API returned ${res.status} ${res.statusText}`
    );
  }

  const json: GitHubContributionsResponse = await res.json();

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join(', ');
    throw new Error(`GitHub GraphQL error: ${messages}`);
  }

  if (!json.data?.user) {
    throw new UserNotFoundError(
      `GitHub user "${username}" not found or has no public contributions.`
    );
  }

  return json.data.user.contributionsCollection.contributionCalendar;
}


export class RateLimitError extends Error {
  public readonly resetAt: number;

  constructor(message: string, resetAt: number) {
    super(message);
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}
