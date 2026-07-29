/**
 * Credential redaction utilities for safe logging.
 *
 * This module prevents accidental leakage of sensitive tokens, passwords, and
 * OAuth credentials into logs, error messages, or API responses. It covers:
 *
 * - **GitHub Personal Access Tokens** (classic and fine-grained PATs) via regex.
 * - **Bearer tokens** (generic `Bearer <token>` patterns).
 * - **Embedded URL credentials** (`https://user:pass@host/path` style).
 * - **x-access-token** SMTP-style credentials in URLs.
 *
 * All public functions in this module are safe to call even with arbitrary
 * untrusted input — they never throw and never expose credential material.
 */

const EMBEDDED_CREDENTIAL_URL = /https?:\/\/[^@\s/]+@/gi;
const X_ACCESS_TOKEN = /x-access-token:[^@\s]+@/gi;
const GITHUB_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g;
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._-]+/gi;

/**
 * Redacts GitHub credential material from a string before it is logged or
 * returned in an API response.
 *
 * The redaction is performed by four sequential regex replacements:
 * 1. `x-access-token:<token>@`     → `x-access-token:[REDACTED]@`
 * 2. `Bearer <token>`              → `Bearer [REDACTED]`
 * 3. `https://[user]:[pass]@`      → `https://[REDACTED]@`
 * 4. `gh[pousr]_*` / `github_pat_*` PATs → `[REDACTED_GITHUB_TOKEN]`
 *
 * The function is safe to call on arbitrary input — it never throws.
 *
 * @param message - The raw string that may contain credential material.
 *   If not a string, it is coerced via `String()` before redaction.
 * @returns The input string with all matched credential patterns replaced
 *   by safe placeholder strings.
 *
 * @example
 * sanitizeGitCredentialLeak('GET /api?token=ghp_abc123...xyz');
 * // → 'GET /api?token=[REDACTED_GITHUB_TOKEN]'
 *
 * @example
 * sanitizeGitCredentialLeak('Authorization: Bearer my_secret_token');
 * // → 'Authorization: Bearer [REDACTED]'
 */
export function sanitizeGitCredentialLeak(message: string): string {
  return message
    .replace(X_ACCESS_TOKEN, 'x-access-token:[REDACTED]@')
    .replace(BEARER_TOKEN, 'Bearer [REDACTED]')
    .replace(EMBEDDED_CREDENTIAL_URL, 'https://[REDACTED]@')
    .replace(GITHUB_TOKEN, '[REDACTED_GITHUB_TOKEN]');
}

/**
 * Sanitizes an error for inclusion in logs or API responses by:
 * 1. Extracting the error message (from an `Error` instance, or coercing
 *    any other value via `String()`).
 * 2. Running `sanitizeGitCredentialLeak` on the extracted message to
 *    redact any embedded tokens or credentials.
 *
 * This function is safe to call with `null`, `undefined`, a plain object,
 * or any other value — it never throws.
 *
 * @param err - The error or value to sanitize.
 * @returns A string safe for logging, with all credential patterns replaced.
 *
 * @example
 * try {
 *   fetch('/api', { headers: { Authorization: `Bearer ${token}` } });
 * } catch (err) {
 *   logger.error(sanitizeErrorForLogging(err));
 * }
 */
export function sanitizeErrorForLogging(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return sanitizeGitCredentialLeak(msg);
}

/**
 * Formats an `owner` / `repo` pair as a safe log string.
 *
 * This is a thin wrapper that concatenates `owner` and `repo` with a `/`
 * separator. Its primary purpose is to document the intended log-safe
 * representation and to provide a single place to update if a different
 * format is needed in the future.
 *
 * @param owner - The repository owner (user or organization login).
 * @param repo  - The repository name.
 * @returns A string in the form `'owner/repo'`.
 *
 * @example
 * formatRepoRefForLogging('octocat', 'Hello-World');
 * // → 'octocat/Hello-World'
 */
export function formatRepoRefForLogging(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}
