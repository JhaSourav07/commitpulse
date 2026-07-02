import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

const makeRequest = (search = '') =>
  new Request(`http://localhost:3000/api/achievements?${search}`);

describe('Achievements Route Accessibility', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined);
    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: {
        username: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://example.com/avatar.png',
        stats: { repositories: 1, followers: 0, following: 0, stars: 0 },
      },
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
      },
      languages: [],
    } as never);

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a human-readable error when username is missing so assistive technologies can announce the problem', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('Valid username parameter is required');
    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error.trim().length).toBeGreaterThan(0);
  });

  it('returns valid parseable JSON responses so assistive clients can reliably interpret state', async () => {
    const response = await GET(makeRequest('username=octocat'));
    const text = await response.text();

    expect(() => JSON.parse(text)).not.toThrow();

    const contentType = response.headers.get('content-type') || '';
    expect(contentType.toLowerCase()).toContain('application/json');
    expect(response.status).toBe(200);
  });

  it('communicates user-not-found failures using descriptive plain-language text', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest('username=ghost123'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('User not found');
    expect(body.error).not.toContain('undefined');
    expect(body.error.trim().length).toBeGreaterThan(0);
  });

  it('communicates rate-limit failures using descriptive plain-language text', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('API rate limit exceeded'));

    const response = await GET(makeRequest('username=octocat'));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('GitHub API rate limit reached. Please try again later.');
    expect(body.error).not.toMatch(/^\d+$/);
    expect(body.error).not.toContain('undefined');
  });

  it('returns a safe fallback message for unknown thrown values without leaking implementation details', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue('unknown');

    const response = await GET(makeRequest('username=octocat'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('undefined');
    expect(body.error).not.toContain('null');
    expect(body.error).not.toMatch(/at\s+\w+\s+\(/);
  });

  it('produces safe text-only error output that does not inject markup into consuming interfaces', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValue(new Error('Internal failure'));

    const response = await GET(makeRequest('username=octocat'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(typeof body.error).toBe('string');
    expect(body.error).not.toMatch(/<script/i);
    expect(body.error).not.toMatch(/<\/?[a-z][\s\S]*>/i);
    expect(body.error.trim().length).toBeGreaterThan(0);
  });
});
