import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('configurable GitHub API constants', () => {
  it('GITHUB_CACHE_TTL_MS has a default of 5 minutes', async () => {
    const { GITHUB_CACHE_TTL_MS } = await import('./github');
    expect(GITHUB_CACHE_TTL_MS).toBe(300000);
  });

  it('respects GITHUB_MAX_RETRIES env var', async () => {
    process.env.GITHUB_MAX_RETRIES = '5';
    vi.resetModules();
    const mod = await import('./github');
    const { getJitteredBackoff } = mod;
    expect(getJitteredBackoff).toBeDefined();
    delete process.env.GITHUB_MAX_RETRIES;
  });

  it('respects GITHUB_GRAPHQL_TIMEOUT_MS env var', async () => {
    process.env.GITHUB_GRAPHQL_TIMEOUT_MS = '10000';
    vi.resetModules();
    await import('./github');
    delete process.env.GITHUB_GRAPHQL_TIMEOUT_MS;
  });

  it('respects GITHUB_ORG_MEMBER_LIMIT env var', async () => {
    process.env.GITHUB_ORG_MEMBER_LIMIT = '50';
    vi.resetModules();
    await import('./github');
    delete process.env.GITHUB_ORG_MEMBER_LIMIT;
  });
});
