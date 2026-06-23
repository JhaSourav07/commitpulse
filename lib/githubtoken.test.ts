import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encryptToken } from './crypto';
import { getUserGitHubToken } from './githubtoken';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

describe('getUserGitHubToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz012345');
    vi.mocked(cookies).mockResolvedValue({
      toString: () => 'authjs.session-token=test',
    } as never);
  });

  it('decrypts the GitHub token from the JWT cookie', async () => {
    const plainToken = 'gho_test_access_token';
    vi.mocked(getToken).mockResolvedValue({ ghToken: encryptToken(plainToken) });

    await expect(getUserGitHubToken()).resolves.toBe(plainToken);
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({
        req: { headers: { cookie: 'authjs.session-token=test' } },
      })
    );
  });

  it('returns undefined when the JWT has no GitHub token', async () => {
    vi.mocked(getToken).mockResolvedValue({ sub: 'user-1' });

    await expect(getUserGitHubToken()).resolves.toBeUndefined();
  });

  it('returns undefined when encrypted token material is corrupt', async () => {
    vi.mocked(getToken).mockResolvedValue({ ghToken: 'not-valid-ciphertext' });

    await expect(getUserGitHubToken()).resolves.toBeUndefined();
  });
});
