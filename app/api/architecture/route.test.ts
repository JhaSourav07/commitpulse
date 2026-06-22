import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { auth } from '@/auth';
import { verifyArchitectureRepoAccess } from '@/lib/architecture-repo-access';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { architectureRateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/architecture-repo-access', () => ({
  verifyArchitectureRepoAccess: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(),
}));

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/architecture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
    vi.spyOn(architectureRateLimiter, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: 123456789,
    });
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'user@example.com' },
    } as never);
    vi.mocked(getUserGitHubToken).mockResolvedValue('gho_user_token');
    vi.mocked(verifyArchitectureRepoAccess).mockResolvedValue({ ok: true });
  });

  it('requires authentication', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await POST(makeRequest({ repoUrl: 'https://github.com/octocat/hello-world' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required.' });
    expect(verifyArchitectureRepoAccess).not.toHaveBeenCalled();
  });

  it('rejects requests when the analysis budget is exhausted', async () => {
    vi.spyOn(architectureRateLimiter, 'checkWithResult').mockResolvedValueOnce({
      success: false,
      limit: 3,
      remaining: 0,
      reset: 123456789,
    });

    const response = await POST(makeRequest({ repoUrl: 'https://github.com/octocat/hello-world' }));

    expect(response.status).toBe(429);
    expect(verifyArchitectureRepoAccess).not.toHaveBeenCalled();
  });

  it('returns 400 when repoUrl is missing', async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Repository URL is required' });
  });

  it('returns 400 for invalid GitHub URLs', async () => {
    const response = await POST(makeRequest({ repoUrl: 'https://example.com/not-github' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid GitHub repository URL' });
  });

  it('denies access when the repository is not visible to the caller', async () => {
    vi.mocked(verifyArchitectureRepoAccess).mockResolvedValue({ ok: false, status: 404 });

    const response = await POST(
      makeRequest({ repoUrl: 'https://github.com/octocat/private-repo' })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Repository not found or you do not have permission to analyze it.',
    });
    expect(verifyArchitectureRepoAccess).toHaveBeenCalledWith(
      'octocat',
      'private-repo',
      'gho_user_token'
    );
  });

  it('verifies repository access with the caller OAuth token only', async () => {
    vi.mocked(verifyArchitectureRepoAccess).mockResolvedValue({ ok: false, status: 404 });

    await POST(makeRequest({ repoUrl: 'https://github.com/octocat/hello-world' }));

    expect(verifyArchitectureRepoAccess).toHaveBeenCalledWith(
      'octocat',
      'hello-world',
      'gho_user_token'
    );
  });
});
