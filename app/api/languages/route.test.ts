import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  fetchUserRepos: vi.fn(),
  aggregateLanguages: vi.fn((repos) => {
    if (!repos || repos.length === 0) return [];
    return [
      { name: 'JavaScript', percentage: 60, color: '#f1e05a' },
      { name: 'TypeScript', percentage: 40, color: '#3178c6' },
    ];
  }),
}));

import { fetchUserRepos } from '@/lib/github';

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/languages');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('GET /api/languages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username is missing', async () => {
    const req = makeRequest({});
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Username is required');
  });

  it('returns 400 JSON when username is missing and format=json', async () => {
    const req = makeRequest({ format: 'json' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Username is required');
  });

  it('returns 400 when username format is invalid', async () => {
    const req = makeRequest({ user: 'invalid username!' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Invalid username format');
  });

  it('returns 200 SVG visual card when username is valid', async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue([
      { name: 'repo1', stargazers_count: 10, language: 'JavaScript' },
      { name: 'repo2', stargazers_count: 5, language: 'TypeScript' },
    ] as any);

    const req = makeRequest({ user: 'octocat' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    const body = await res.text();
    expect(body).toContain('octocat&#39;s Top Languages');
    expect(body).toContain('JavaScript');
    expect(body).toContain('TypeScript');
  });

  it('returns 200 JSON payload when format=json', async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue([
      { name: 'repo1', stargazers_count: 10, language: 'JavaScript' },
      { name: 'repo2', stargazers_count: 5, language: 'TypeScript' },
    ] as any);

    const req = makeRequest({ user: 'octocat', format: 'json' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.username).toBe('octocat');
    expect(json.totalRepos).toBe(2);
    expect(json.languages).toHaveLength(2);
  });

  it('returns 304 Not Modified when ETag matches if-none-match', async () => {
    vi.mocked(fetchUserRepos).mockResolvedValue([
      { name: 'repo1', stargazers_count: 10, language: 'JavaScript' },
    ] as any);

    const initialReq = makeRequest({ user: 'octocat' });
    const initialRes = await GET(initialReq);
    const etag = initialRes.headers.get('etag');

    expect(etag).toBeTruthy();

    const cacheReq = makeRequest({ user: 'octocat' }, { 'if-none-match': etag! });
    const cacheRes = await GET(cacheReq);

    expect(cacheRes.status).toBe(304);
  });

  it('handles user not found error gracefully', async () => {
    vi.mocked(fetchUserRepos).mockRejectedValue(new Error('User not found'));

    const req = makeRequest({ user: 'nonexistentuser' });
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain('User not found');
  });
});
