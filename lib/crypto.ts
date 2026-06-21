import 'server-only';
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 600_000;
let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const k = process.env.ENCRYPTION_KEY;
  if (!k || k.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  const salt = crypto.createHash('sha256').update(k).digest();
  cachedKey = crypto.pbkdf2Sync(k, salt, PBKDF2_ITERATIONS, 32, 'sha512');
  return cachedKey;
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
}

export function decryptToken(payload: string): string {
  const parts = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  if (parts.length !== 3) throw new Error('Invalid encrypted payload format');
  const [iv, tag, enc] = parts;
  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
