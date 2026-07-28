import 'server-only';
import crypto from 'crypto';

/**
 * Server-side notification management token generation, hashing, and verification.
 *
 * This module provides a complete lifecycle for one-time management tokens used in
 * CommitPulse's notification system. Tokens are opaque, cryptographically random
 * strings prefixed with `cpn_`. They are never stored in plaintext; only their
 * SHA-256 hashes are persisted. Verification uses a constant-time comparison to
 * prevent timing side-channel attacks.
 *
 * @module
 */

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';

/**
 * Generates a cryptographically random notification management token.
 *
 * Uses `crypto.randomBytes` for strong entropy and encodes the result as a
 * URL-safe base64 string (base64url). The token is prefixed with `cpn_` so it
 * can be identified in logs and configuration without exposing its value.
 *
 * @returns A prefixed, base64url-encoded token string (e.g. `cpn_abc123...xyz`).
 *
 * @remarks
 * Store only the hash of this token (via `hashNotificationManagementToken`) in
 * your database. Never log or return the plaintext token except once to the user.
 */
export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

/**
 * Produces a SHA-256 hash of a notification management token for storage.
 *
 * Hashes the token using SHA-256 and returns a 64-character lowercase hex string.
 * This hash is what should be persisted alongside the user's record.
 *
 * @param token - The plaintext token returned by `createNotificationManagementToken`.
 * @returns A 64-character hexadecimal SHA-256 digest of the token.
 *
 * @remarks
 * The same token always produces the same hash, so equality checks on the
 * stored hash are sufficient to verify a presented token.
 */
export function hashNotificationManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Extracts a notification management token from an incoming HTTP request.
 *
 * Resolution priority:
 * 1. `x-notification-token` request header (preferred — avoids token in URL/query string)
 * 2. `managementToken` field in the request body JSON
 *
 * @param request - The incoming `Request` object.
 * @param body - Optional parsed request body. If provided, `managementToken` is
 *   checked as a fallback after the header.
 * @returns The trimmed token string from the header or body, or `null` if neither
 *   was present or valid.
 *
 * @remarks
 * A null return means no token was supplied — callers should treat this as an
 * unauthenticated request and return an appropriate error response.
 */
export function getNotificationManagementToken(
  request: Request,
  body?: { managementToken?: unknown }
): string | null {
  const headerToken = request.headers.get('x-notification-token')?.trim();
  if (headerToken) return headerToken;

  const bodyToken = body?.managementToken;
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }

  return null;
}

/**
 * Verifies a presented token against a stored hash using constant-time comparison.
 *
 * Rejects early if either argument is falsy or if the stored hash does not match
 * the expected 64-character SHA-256 hex format. Uses `crypto.timingSafeEqual`
 * to prevent timing attacks that could leak information about the stored hash.
 *
 * @param providedToken - The plaintext token presented by the client.
 * @param storedHash - The SHA-256 hex hash previously stored in the database.
 * @returns `true` if the presented token matches the stored hash, `false` otherwise.
 *
 * @remarks
 * Even on a `false` return, no information about the stored hash value is leaked
 * via timing — the function always performs the full constant-time comparison.
 */
export function verifyNotificationManagementToken(
  providedToken: string | null,
  storedHash?: string | null
): boolean {
  if (!providedToken || !storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const providedHash = hashNotificationManagementToken(providedToken);
  const stored = Buffer.from(storedHash, 'hex');
  const provided = Buffer.from(providedHash, 'hex');

  return stored.length === provided.length && crypto.timingSafeEqual(stored, provided);
}
