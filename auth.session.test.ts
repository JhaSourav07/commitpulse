import { describe, expect, it } from 'vitest';
import { buildClientSession } from './auth';

describe('buildClientSession', () => {
  it('exposes hasGitHubToken without leaking encrypted token material', () => {
    const session = buildClientSession(
      {
        user: { name: 'Octocat', email: 'octocat@github.com' },
        expires: '2099-01-01T00:00:00.000Z',
      },
      { ghToken: 'encrypted.token.material' }
    );

    expect(session.hasGitHubToken).toBe(true);
    expect(session).not.toHaveProperty('ghToken');
  });

  it('marks hasGitHubToken false when the JWT has no GitHub token', () => {
    const session = buildClientSession(
      {
        user: { name: 'Guest', email: 'guest@example.com' },
        expires: '2099-01-01T00:00:00.000Z',
      },
      {}
    );

    expect(session.hasGitHubToken).toBe(false);
    expect(session).not.toHaveProperty('ghToken');
  });
});
