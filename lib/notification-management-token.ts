import 'server-only';
import crypto from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';

/**
 * Generates a cryptographically random notification management token.
 *
 * The token is composed of the fixed prefix `cpn_` followed by 32 random
 * bytes encoded in base64url format, yielding a compact, URL-safe string.
 *
 * @returns A new random token string, e.g. `"cpn_abc123xyz..."`.
 */
export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

/**
 * Produces a SHA-256 hex digest of the given notification management token.
 *
 * @param token - The raw token string to hash.
 * @returns A 64-character lowercase hexadecimal string (the SHA-256 digest).
 */
export function hashNotificationManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Extracts the notification management token from an incoming HTTP request.
 *
 * Checks the `x-notification-token` header first, then falls back to the
 * `managementToken` field in the optional JSON request body.
 *
 * @param request - The incoming `Request` object.
 * @param body    - Optional parsed JSON body to check as a fallback source.
 * @returns The token string if found and non-empty, otherwise `null`.
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
 * Verifies a provided notification management token against a stored SHA-256 hash
 * using a timing-safe comparison to prevent timing attacks.
 *
 * @param providedToken - The raw token string supplied by the client.
 * @param storedHash     - The SHA-256 hex digest previously stored at registration time.
 * @returns `true` if the token matches the stored hash, `false` otherwise.
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
