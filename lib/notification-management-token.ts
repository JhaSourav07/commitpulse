import 'server-only';
import crypto from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';

export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

export function hashNotificationManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

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
