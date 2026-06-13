const GITHUB_USER_API_URL = 'https://api.github.com/user';
const VERIFY_TIMEOUT_MS = 5000;

export type GitHubOwnerVerificationResult =
  | { verified: true }
  | {
      verified: false;
      status: 401 | 403 | 502;
      message: string;
    };

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

/**
 * Verifies that the caller's GitHub access token belongs to the requested username.
 *
 * Tokens are used only for the GitHub `/user` verification request and are never
 * stored, logged, or included in error responses.
 */
export async function verifyGitHubOwner(
  request: Request,
  requestedUsername: string
): Promise<GitHubOwnerVerificationResult> {
  const token = getBearerToken(request);
  if (!token) {
    return {
      verified: false,
      status: 401,
      message: 'GitHub authentication is required.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(GITHUB_USER_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'CommitPulse',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (response.status === 401) {
      return {
        verified: false,
        status: 401,
        message: 'Invalid or expired GitHub access token.',
      };
    }

    if (!response.ok) {
      return {
        verified: false,
        status: 502,
        message: 'Unable to verify GitHub account ownership.',
      };
    }

    const profile = (await response.json()) as { login?: unknown };
    if (
      typeof profile.login !== 'string' ||
      profile.login.toLowerCase() !== requestedUsername.trim().toLowerCase()
    ) {
      return {
        verified: false,
        status: 403,
        message: 'The authenticated GitHub account does not own this username.',
      };
    }

    return { verified: true };
  } catch {
    return {
      verified: false,
      status: 502,
      message: 'Unable to verify GitHub account ownership.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
