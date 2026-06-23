import crypto from 'node:crypto';

export interface DecryptedToken {
  token: string;
  nextIndex: number;
}

export interface EncryptedTokenData {
  token: string;
  encryptedToken: string;
  rotationIndex: number;
}

/**
 * Encrypt GitHub token for storage.
 * @param token - GitHub PAT or token
 * @returns Encrypted token in hex format
 */
export function encryptGitHubToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid GitHub token');
  }

  try {
    const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

    if (!key) {
      console.warn(
        'GITHUB_TOKEN_ENCRYPTION_KEY not configured. ' +
          'GitHub tokens should be encrypted in production.'
      );
      return token; // Return plaintext if encryption not configured (dev only)
    }

    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== 32) {
      throw new Error('Encryption key must be 32 bytes');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV + encrypted token
    return iv.toString('hex') + ':' + encrypted;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token encryption failed: ${message}`);
  }
}

/**
 * Decrypt GitHub token for use.
 * @param encryptedToken - Encrypted token in hex format
 * @returns Decrypted GitHub token
 */
export function decryptGitHubToken(encryptedToken: string): string {
  try {
    const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

    // If encryption not configured, return as-is (dev fallback)
    if (!key) {
      return encryptedToken;
    }

    const keyBuffer = Buffer.from(key, 'base64');

    const [ivHex, encryptedHex] = encryptedToken.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token decryption failed: ${message}`);
  }
}

/**
 * Parse comma-separated tokens and return encrypted array.
 * Handles legacy comma-separated format and encrypts each token.
 * @param tokenString - Comma-separated tokens or single token
 * @returns Array of {token: string, encryptedToken: string}
 */
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

  // Validate token format (should start with ghp_ or ghu_)
  for (const token of tokens) {
    if (!token.startsWith('ghp_') && !token.startsWith('ghu_')) {
      console.warn(`Token does not appear to be valid GitHub PAT: ${token.substring(0, 5)}...`);
    }
  }

  // Encrypt each token
  return tokens.map((token) => ({
    token, // Keep plaintext temporarily for return value
    encryptedToken: encryptGitHubToken(token),
    rotationIndex: tokens.indexOf(token),
  }));
}

/**
 * Get next GitHub token from encrypted rotation list.
 * Used to rotate tokens and distribute rate limits.
 * @param encryptedTokens - Array of encrypted tokens
 * @param currentIndex - Current rotation index
 * @returns {token: string, nextIndex: number}
 */
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

/**
 * Validate that a token is properly encrypted.
 * @param encryptedToken - Token to validate
 * @returns True if token appears to be encrypted
 */
export function isEncryptedToken(encryptedToken: string | null | undefined): boolean {
  if (!encryptedToken || typeof encryptedToken !== 'string') {
    return false;
  }

  // Encrypted tokens have format: hex:hex
  const parts = encryptedToken.split(':');
  if (parts.length !== 2) {
    return false;
  }

  // Both parts should be valid hex
  for (const part of parts) {
    if (!/^[a-f0-9]+$/i.test(part)) {
      return false;
    }
  }

  return true;
}

/**
 * CRITICAL: Never log or expose full GitHub tokens.
 * Logging utility that safely redacts tokens.
 * @param token - Token to redact for logging
 * @returns Redacted token for safe logging
 */
export function redactToken(token: string | null | undefined): string {
  if (!token || token.length < 10) {
    return '***';
  }

  const start = token.substring(0, 4);
  const end = token.substring(token.length - 4);
  return `${start}...${end}`;
}
