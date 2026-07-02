import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGitHubUserExists } from './useGitHubUserExists';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('octocat')) {
        return {
          json: async () => ({ exists: true, login: 'octocat', avatar_url: 'https://x/o.png' }),
        };
      }
      if (url.includes('ghost')) {
        return { json: async () => ({ exists: false, reason: 'not_found' }) };
      }
      return { json: async () => ({ exists: false, reason: 'unverifiable' }) };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useGitHubUserExists', () => {
  it('returns idle for an empty username', () => {
    const { result } = renderHook(() => useGitHubUserExists(''));
    expect(result.current.status).toBe('idle');
  });

  it('returns idle for an invalid username format', () => {
    const { result } = renderHook(() => useGitHubUserExists('-bad-'));
    expect(result.current.status).toBe('idle');
  });

  it('transitions to checking then exists for a real username', async () => {
    const { result } = renderHook(() => useGitHubUserExists('octocat'));

    // Immediately after mount, before fetch resolves, status is "checking"
    expect(result.current.status).toBe('checking');

    await waitFor(() => {
      expect(result.current.status).toBe('exists');
    });
    expect(result.current.avatarUrl).toBe('https://x/o.png');
  });

  it('resolves to not_found for a nonexistent username', async () => {
    const { result } = renderHook(() => useGitHubUserExists('ghost'));

    await waitFor(() => {
      expect(result.current.status).toBe('not_found');
    });
    expect(result.current.avatarUrl).toBeNull();
  });

  it('does not call fetch for an invalid username', () => {
    renderHook(() => useGitHubUserExists('-bad-'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('re-checks when the username prop changes', async () => {
    const { result, rerender } = renderHook(
      ({ username }: { username: string }) => useGitHubUserExists(username),
      { initialProps: { username: 'octocat' } }
    );

    await waitFor(() => expect(result.current.status).toBe('exists'));

    rerender({ username: 'ghost' });

    await waitFor(() => expect(result.current.status).toBe('not_found'));
  });
});
