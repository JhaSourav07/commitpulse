import 'server-only';
import crypto from 'crypto';

import { hashSync, compareSync } from 'bcryptjs';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';
const BCRYPT_COST = 12;

/**
 * Generates a new cryptographically random notification management token.
 * Tokens are prefixed with 'cpn_' and encoded in base64url.
 */
export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

/**
 * Returns the SHA-256 hex digest of a notification management token.
 * Use this to store a hash rather than the plaintext token.
 */
export function hashNotificationManagementToken(token: string): string {
  return hashSync(token, BCRYPT_COST);
}

/**
 * Extracts the notification management token from a request.
 * Checks the `x-notification-token` header first, then the request body.
 *
 * @param request - The incoming HTTP request.
 * @param body    - Optional parsed request body.
 * @returns The token string, or null if neither header nor body contains one.
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
 * Verifies a provided token against a stored SHA-256 hash using a timing-safe comparison
 * to prevent timing attacks.
 *
 * @param providedToken - The token string to verify.
 * @param storedHash    - The stored SHA-256 hex hash to compare against.
 */
export function verifyNotificationManagementToken(
  providedToken: string | null,
  storedHash?: string | null
): boolean {
  if (!providedToken || !storedHash) {
    return false;
  }

  return compareSync(providedToken, storedHash);
}
