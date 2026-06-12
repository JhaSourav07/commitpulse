import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LEN = 32;

// The encryption key should be exactly 32 bytes for AES-256
// In production, ensure ENCRYPTION_KEY is securely set in environment variables
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY || 'default_commitpulse_secret_key_32';
  // Use scrypt to securely derive a 32-byte key from the environment variable
  return crypto.scryptSync(key, 'commitpulse_salt', KEY_LEN);
};

/**
 * Securely encrypts a third-party API token using AES-256-GCM.
 * @param plaintextToken The plaintext API token (e.g., GitHub PAT)
 * @returns The encrypted token string in the format iv:tag:encryptedData
 */
export function encryptToken(plaintextToken: string): string {
  if (!plaintextToken) return plaintextToken;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintextToken, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
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
  if (parts.length !== 3) {
    // Return original string if it doesn't match the encrypted format
    // This allows graceful fallback for any legacy plaintext tokens
    return encryptedString;
  }

  const [ivHex, tagHex, encrypted] = parts;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getEncryptionKey();

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
