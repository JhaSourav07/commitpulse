import 'server-only';
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 100_000;

function deriveKey(salt: Buffer): Buffer {
  const passphrase = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!passphrase || passphrase.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha512');
}

function isGcmFormat(payload: string): boolean {
  const parts = payload.split('.');
  return parts.length === 4;
}

function isLegacyCbcFormat(payload: string): boolean {
  const parts = payload.split(':');
  return parts.length === 2;
}

export interface DecryptedToken {
  token: string;
  nextIndex: number;
}

export interface EncryptedTokenData {
  token: string;
  encryptedToken: string;
  rotationIndex: number;
}

export function encryptGitHubToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid GitHub token');
  }

  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    console.warn(
      'GITHUB_TOKEN_ENCRYPTION_KEY not configured. ' +
        'GitHub tokens should be encrypted in production.'
    );
    return token;
  }

  try {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, deriveKey(salt), iv);
    const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [salt, iv, tag, enc].map((b) => b.toString('base64')).join('.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token encryption failed: ${message}`);
  }
}

export function decryptGitHubToken(encryptedToken: string): string {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    return encryptedToken;
  }

  if (isGcmFormat(encryptedToken)) {
    try {
      const [salt, iv, tag, enc] = encryptedToken.split('.').map((p) => Buffer.from(p, 'base64'));
      const decipher = crypto.createDecipheriv(ALGO, deriveKey(salt), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Token decryption failed: ${message}`);
    }
  }

  if (isLegacyCbcFormat(encryptedToken)) {
    try {
      const [ivHex, encryptedHex] = encryptedToken.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Token decryption failed: ${message}`);
    }
  }

  throw new Error('Invalid encrypted token format');
}

export function parseAndEncryptTokens(tokenString: string): EncryptedTokenData[] {
  if (!tokenString || typeof tokenString !== 'string') {
    throw new Error('Token string is required');
  }

  const tokens = tokenString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    throw new Error('No valid tokens found');
  }

  for (const token of tokens) {
    if (!token.startsWith('ghp_') && !token.startsWith('ghu_')) {
      console.warn(`Token does not appear to be valid GitHub PAT: ${token.substring(0, 5)}...`);
    }
  }

  return tokens.map((token, index) => ({
    token,
    encryptedToken: encryptGitHubToken(token),
    rotationIndex: index,
  }));
}

export function getNextToken(encryptedTokens: string[], currentIndex = 0): DecryptedToken {
  if (!Array.isArray(encryptedTokens) || encryptedTokens.length === 0) {
    throw new Error('No encrypted tokens available');
  }

  const nextIndex = (currentIndex + 1) % encryptedTokens.length;
  const encryptedToken = encryptedTokens[nextIndex];

  return {
    token: decryptGitHubToken(encryptedToken),
    nextIndex,
  };
}

export function isEncryptedToken(encryptedToken: string | null | undefined): boolean {
  if (!encryptedToken || typeof encryptedToken !== 'string') {
    return false;
  }

  if (isGcmFormat(encryptedToken)) {
    const parts = encryptedToken.split('.');
    return parts.every((p) => {
      try {
        Buffer.from(p, 'base64');
        return true;
      } catch {
        return false;
      }
    });
  }

  if (isLegacyCbcFormat(encryptedToken)) {
    const parts = encryptedToken.split(':');
    return parts.every((p) => /^[a-f0-9]+$/i.test(p));
  }

  return false;
}

export function redactToken(token: string | null | undefined): string {
  if (!token || token.length < 10) {
    return '***';
  }

  const start = token.substring(0, 4);
  const end = token.substring(token.length - 4);
  return `${start}...${end}`;
}
