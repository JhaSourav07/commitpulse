import 'server-only';
import crypto from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';

/**
 * Generates a cryptographically random notification management token.
 *
 * The token is 32 bytes of random data encoded in base64url format,
 * prefixed with `cpn_` to identify it as a CommitPulse notification token.
 *
 * @returns A random token string of the form `cpn_<base64url>`
 */
export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

/**
 * Produces a SHA-256 hash of a notification management token.
 *
 * @param token - The raw token string to hash
 * @returns A 64-character lowercase hex string (SHA-256 digest)
 */
export function hashNotificationManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Extracts a notification management token from a request.
 *
 * Checks the `x-notification-token` request header first, then falls back
 * to the `managementToken` field in the request body.
 *
 * @param request - The incoming request containing headers and optionally a JSON body
 * @param body - Optional parsed request body to check for `managementToken`
 * @returns The token string if found, or `null` if neither source contains a valid token
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
 * Verifies a provided notification management token against a stored hash.
 *
 * Uses `crypto.timingSafeEqual` for a constant-time comparison to prevent
 * timing attacks. The stored hash must be a valid 64-character hex string.
 *
 * @param providedToken - The token string supplied by the client\n * @param storedHash - The SHA-256 hash previously stored server-side\n * @returns `true` if the token matches the hash, `false` otherwise
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
