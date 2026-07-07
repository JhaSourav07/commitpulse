'use client';

import { useEffect, useRef, useState } from 'react';
import { validateGitHubUsername } from '@/lib/validations';

export type GitHubUserExistsStatus = 'idle' | 'checking' | 'exists' | 'not_found' | 'unverifiable';

export interface UseGitHubUserExistsResult {
  status: GitHubUserExistsStatus;
  avatarUrl: string | null;
}

/**
 * Checks whether a (debounced) GitHub username exists, by calling the
 * lightweight /api/github-username-check endpoint.
 *
 * Designed for the generator's "Contribution Visualizations" section, where
 * we want to confirm a real account exists before generating a
 * username-specific workflow + README snippet.
 */
export function useGitHubUserExists(debouncedUsername: string): UseGitHubUserExistsResult {
  const [checkResult, setCheckResult] = useState<{
    forUsername: string;
    status: Exclude<GitHubUserExistsStatus, 'idle' | 'checking'>;
    avatarUrl: string | null;
  } | null>(null);
  const requestIdRef = useRef(0);

  const trimmed = debouncedUsername.trim();
  const isFormatValid = trimmed.length > 0 && validateGitHubUsername(trimmed);

  useEffect(() => {
    if (!isFormatValid) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    fetch(`/api/github-username-check?username=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          exists?: boolean;
          reason?: string;
          avatar_url?: string;
        };

        // Ignore stale responses from a previous (now superseded) username
        if (requestIdRef.current !== requestId) return;

        if (data.exists) {
          setCheckResult({
            forUsername: trimmed,
            status: 'exists',
            avatarUrl: data.avatar_url ?? null,
          });
        } else if (data.reason === 'not_found' || data.reason === 'invalid_format') {
          setCheckResult({ forUsername: trimmed, status: 'not_found', avatarUrl: null });
        } else {
          setCheckResult({ forUsername: trimmed, status: 'unverifiable', avatarUrl: null });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (requestIdRef.current !== requestId) return;
        setCheckResult({ forUsername: trimmed, status: 'unverifiable', avatarUrl: null });
      });

    return () => controller.abort();
  }, [trimmed, isFormatValid]);

  // Derive the externally-visible status synchronously during render:
  // - invalid/empty username → 'idle'
  // - no completed result yet for the *current* username → 'checking'
  //   (covers both "request in flight" and "not started yet" — both render
  //   identically as a loading state, which is the correct UX either way)
  // - otherwise, the last completed result for this exact username
  if (!isFormatValid) {
    return { status: 'idle', avatarUrl: null };
  }

  if (checkResult && checkResult.forUsername === trimmed) {
    return { status: checkResult.status, avatarUrl: checkResult.avatarUrl };
  }

  return { status: 'checking', avatarUrl: null };
}
