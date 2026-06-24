import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  fetchContributedRepos,
  fetchOrgMembers,
  clearGitHubApiCacheForTests,
} from './github';

vi.mock('server-only', () => ({}));

const GITHUB_API = 'https://api.github.com';

const mockCalendar = {
  totalContributions: 100,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-10', color: '#ebedf0' },
        { contributionCount: 0, date: '2024-06-11', color: '#ebedf0' },
        { contributionCount: 5, date: '2024-06-12', color: '#40c463' },
      ],
    },
  ],
};

type Handler = {
  match: (url: string, method: string) => boolean;
  respond: (url: string, body?: unknown) => Response;
};

function graphqlHandler(queryMatch: string, data: unknown): Handler {
  return {
    match: (url, method) => url === `${GITHUB_API}/graphql` && method === 'POST',
    respond: (_url, body) => {
      const q = (body as Record<string, unknown>)?.query as string;
      if (q.includes(queryMatch)) {
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}

function restGetHandler(
  pathPattern: string,
  responder: (params: Record<string, string>, search: string) => unknown
): Handler {
  const parts = pathPattern.split('/');
  return {
    match: (url, method) => {
      if (method !== 'GET') return false;
      try {
        const u = new URL(url);
        const pathParts = u.pathname.split('/');
        if (pathParts.length !== parts.length) return false;
        return parts.every((p, i) => p.startsWith(':') || p === pathParts[i]);
      } catch {
        return false;
      }
    },
    respond: (url) => {
      const u = new URL(url);
      const pathParts = u.pathname.split('/');
      const params: Record<string, string> = {};
      parts.forEach((p, i) => {
        if (p.startsWith(':')) params[p.slice(1)] = pathParts[i];
      });
      return new Response(JSON.stringify(responder(params, u.search)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}

const defaultHandlers: Handler[] = [
  graphqlHandler('contributionCalendar', {
    user: {
      contributionsCollection: {
        contributionCalendar: mockCalendar,
        totalPullRequestContributions: 10,
        totalIssueContributions: 5,
        totalPullRequestReviewContributions: 8,
        commitContributionsByRepository: [
          {
            repository: { nameWithOwner: 'octocat/hello-world' },
            contributions: { totalCount: 25 },
          },
        ],
      },
    },
  }),
  graphqlHandler('repositoriesContributedTo', {
    user: {
      repositoriesContributedTo: {
        nodes: [
          { nameWithOwner: 'octocat/hello-world', description: 'Test repo', stargazerCount: 100 },
        ],
      },
    },
  }),
  restGetHandler('/users/:username', (params) => {
    if (params.username === 'notfound') return null;
    return {
      login: params.username,
      name: 'Test User',
      bio: 'Test bio',
      company: 'Test Co',
      location: 'Test City',
      blog: 'https://example.com',
      twitter_username: 'testuser',
      public_repos: 10,
      followers: 100,
      following: 50,
      created_at: '2010-01-01T00:00:00Z',
    };
  }),
  restGetHandler('/users/:username/repos', (_params, search) => {
    const sp = new URLSearchParams(search);
    const page = sp.get('page') || '1';
    return [
      {
        name: `repo-${page}`,
        full_name: `octocat/repo-${page}`,
        description: 'Test repo',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
        open_issues_count: 0,
        html_url: `https://github.com/octocat/repo-${page}`,
        updated_at: '2024-06-12T00:00:00Z',
      },
    ];
  }),
  restGetHandler('/orgs/:org/members', () => [
    { login: 'member-1', avatar_url: 'https://example.com/avatar1.png' },
  ]),
];

let activeHandlers: Handler[] = [];

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method?.toUpperCase() ?? 'GET';
  let body: unknown;
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  for (const handler of activeHandlers) {
    if (handler.match(urlString, method)) {
      const response = handler.respond(urlString, body);
      if (response.status === 404 && !urlString.includes('notfound')) continue;
      return Promise.resolve(response);
    }
  }

  return Promise.resolve(
    new Response(JSON.stringify({ message: 'Unhandled' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('MSW: fetchGitHubContributions', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    activeHandlers = [...defaultHandlers];
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    clearGitHubApiCacheForTests();
  });

  it('returns contribution calendar via intercepted GraphQL request', async () => {
    const result = await fetchGitHubContributions('octocat');
    expect(result.calendar.totalContributions).toBe(100);
    expect(result.calendar.weeks[0].contributionDays[0].contributionCount).toBe(3);
  });

  it('returns 401 for missing auth token', async () => {
    delete process.env.GITHUB_PAT;
    delete process.env.GITHUB_TOKEN;
    await expect(fetchGitHubContributions('octocat')).rejects.toThrow();
  });
});

describe('MSW: fetchUserProfile', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    activeHandlers = [...defaultHandlers];
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    clearGitHubApiCacheForTests();
  });

  it('returns user profile via intercepted REST request', async () => {
    const profile = await fetchUserProfile('octocat');
    expect(profile.login).toBe('octocat');
    expect(profile.name).toBe('Test User');
  });

  it('throws for non-existent user', async () => {
    await expect(fetchUserProfile('notfound')).rejects.toThrow();
  });
});

describe('MSW: fetchUserRepos', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    activeHandlers = [...defaultHandlers];
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    clearGitHubApiCacheForTests();
  });

  it('returns repositories via intercepted REST request', async () => {
    const repos = await fetchUserRepos('octocat');
    expect(repos).toBeDefined();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
  });
});

describe('MSW: fetchContributedRepos', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    activeHandlers = [...defaultHandlers];
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    clearGitHubApiCacheForTests();
  });

  it('returns contributed repos via intercepted GraphQL request', async () => {
    const repos = await fetchContributedRepos('octocat');
    expect(repos).toBeDefined();
    expect(Array.isArray(repos)).toBe(true);
  });
});

describe('MSW: fetchOrgMembers', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    activeHandlers = [...defaultHandlers];
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    clearGitHubApiCacheForTests();
  });

  it('returns org members via intercepted REST request', async () => {
    const members = await fetchOrgMembers('testorg');
    expect(members).toBeDefined();
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThan(0);
  });
});

describe('MSW: error handling', () => {
  it('handles 500 server errors gracefully', async () => {
    activeHandlers = [restGetHandler('/users/:username', () => null)];
    activeHandlers[0].respond = () =>
      new Response(JSON.stringify({ message: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    globalThis.fetch = mockFetch as typeof fetch;

    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();
    await expect(fetchUserProfile('octocat')).rejects.toThrow();
  });

  it('handles network errors gracefully by falling back to mock profile', async () => {
    globalThis.fetch = (() => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;

    process.env.GITHUB_PAT = 'test-token';
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();
    const result = await fetchUserProfile('octocat');
    expect(result.isOfflineFallback).toBe(true);
    expect(result.login).toBe('octocat');
  });
});
