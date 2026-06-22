const GITHUB_API_ORIGIN = 'https://api.github.com';
const VERIFY_TIMEOUT_MS = 5000;

const GITHUB_OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/;
const GITHUB_REPO_PATTERN = /^[a-zA-Z0-9._-]+$/;

export type ArchitectureRepoAccessResult =
  | { ok: true; cloneToken?: string }
  | { ok: false; status: 404 | 403 | 502 };

function isValidGitHubOwner(owner: string): boolean {
  return owner.length > 0 && owner.length <= 39 && GITHUB_OWNER_PATTERN.test(owner);
}

function isValidGitHubRepoName(repo: string): boolean {
  return repo.length > 0 && repo.length <= 100 && GITHUB_REPO_PATTERN.test(repo);
}

function buildGitHubRepoApiUrl(owner: string, repo: string): URL | null {
  if (!isValidGitHubOwner(owner) || !isValidGitHubRepoName(repo)) {
    return null;
  }

  return new URL(
    `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    `${GITHUB_API_ORIGIN}/`
  );
}

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
  const apiUrl = buildGitHubRepoApiUrl(owner, repo);
  if (!apiUrl) {
    return { ok: false, status: 404 };
  }

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
    const response = await fetch(apiUrl.href, {
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
