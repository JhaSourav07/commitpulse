import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyArchitectureRepoAccess } from './architecture-repo-access';

describe('verifyArchitectureRepoAccess', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows public repositories without a user token', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ private: false }), { status: 200 })
    );

    const result = await verifyArchitectureRepoAccess('octocat', 'hello-world');

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/octocat/hello-world',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });

  it('requires a user token for private repositories', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ private: true }), { status: 200 }))
    );

    const withoutToken = await verifyArchitectureRepoAccess('octocat', 'private-repo');
    expect(withoutToken).toEqual({ ok: false, status: 403 });

    const withToken = await verifyArchitectureRepoAccess(
      'octocat',
      'private-repo',
      'gho_user_token'
    );
    expect(withToken).toEqual({ ok: true, cloneToken: 'gho_user_token' });
  });

  it('returns 404 when GitHub reports the repository is missing', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    const result = await verifyArchitectureRepoAccess('octocat', 'missing-repo', 'gho_user_token');

    expect(result).toEqual({ ok: false, status: 404 });
  });
});
