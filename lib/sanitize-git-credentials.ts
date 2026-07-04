const EMBEDDED_CREDENTIAL_URL = /https?:\/\/[^@\s/]+@/gi;
const X_ACCESS_TOKEN = /x-access-token:[^@\s]+@/gi;
const GITHUB_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g;
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._-]+/gi;

/**
 * Redacts GitHub credential material from strings before they are logged or returned.
 */
export function sanitizeGitCredentialLeak(message: string): string {
  return message
    .replace(X_ACCESS_TOKEN, 'x-access-token:[REDACTED]@')
    .replace(BEARER_TOKEN, 'Bearer [REDACTED]')
    .replace(EMBEDDED_CREDENTIAL_URL, 'https://[REDACTED]@')
    .replace(GITHUB_TOKEN, '[REDACTED_GITHUB_TOKEN]');
}

export function sanitizeErrorForLogging(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return sanitizeGitCredentialLeak(msg);
}

/**
 * Returns a log-safe repository reference without embedded URL credentials.
 */
export function formatRepoRefForLogging(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}
