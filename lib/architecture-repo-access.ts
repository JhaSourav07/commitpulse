const GITHUB_REPO_API = 'https://api.github.com/repos';
const VERIFY_TIMEOUT_MS = 5000;

export type ArchitectureRepoAccessResult =
  | { ok: true; cloneToken?: string }
  | { ok: false; status: 404 | 403 | 502 };

/**
 * Verifies that a repository exists and is accessible to the caller.
 *
 * Public repositories can be analyzed without a token. Private repositories
 * require the caller's OAuth token — the server PAT is never used here.
 */
export async function verifyArchitectureRepoAccess(
  owner: string,
  repo: string,
  userToken?: string
): Promise<ArchitectureRepoAccessResult> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CommitPulse',
  };

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(`${GITHUB_REPO_API}/${owner}/${repo}`, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (response.status === 404) {
      return { ok: false, status: 404 };
    }

    if (response.status === 403) {
      return { ok: false, status: 403 };
    }

    if (!response.ok) {
      return { ok: false, status: 502 };
    }

    const data = (await response.json()) as { private?: boolean };

    if (data.private) {
      if (!userToken) {
        return { ok: false, status: 403 };
      }
      return { ok: true, cloneToken: userToken };
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 502 };
  } finally {
    clearTimeout(timeoutId);
  }
}
