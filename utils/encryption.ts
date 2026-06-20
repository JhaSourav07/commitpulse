import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LEN = 32;
const ENCRYPTED_TOKEN_VERSION = 'v1';
const MIN_KEY_LENGTH = 32;

const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < MIN_KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be configured with at least ${MIN_KEY_LENGTH} characters`);
  }

  return crypto.scryptSync(key, 'commitpulse_salt', KEY_LEN);
};

/**
 * Securely encrypts a third-party API token using AES-256-GCM.
 * @param plaintextToken The plaintext API token (e.g., GitHub PAT)
 * @returns The encrypted token string in the format v1:iv:tag:encryptedData
 */
export function encryptToken(plaintextToken: string): string {
  if (!plaintextToken) return plaintextToken;

  const key = getEncryptionKey();

  try {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintextToken, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${ENCRYPTED_TOKEN_VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt token securely');
  }
}

/**
 * Decrypts a securely stored API token back to plaintext.
 * @param encryptedString The encrypted token string from the database
 * @returns The plaintext API token
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return encryptedString;

  const parts = encryptedString.split(':');
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_TOKEN_VERSION) {
    throw new Error('Invalid encrypted token format');
  }

  const [, ivHex, tagHex, encrypted] = parts;
  const isHex = (value: string) => /^[0-9a-f]+$/i.test(value);
  if (
    ivHex.length !== IV_LENGTH * 2 ||
    tagHex.length !== TAG_LENGTH * 2 ||
    encrypted.length === 0 ||
    encrypted.length % 2 !== 0 ||
    !isHex(ivHex) ||
    !isHex(tagHex) ||
    !isHex(encrypted)
  ) {
    throw new Error('Invalid encrypted token format');
  }

  const key = getEncryptionKey();

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Do not return partial or corrupted data on decryption failure
    throw new Error('Failed to decrypt token securely');
  }
}
