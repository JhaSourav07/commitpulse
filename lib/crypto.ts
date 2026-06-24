import 'server-only';
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function key(salt: Buffer): Buffer {
  const k = process.env.ENCRYPTION_KEY;
  if (!k || k.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return crypto.pbkdf2Sync(k, salt, 100000, 32, 'sha512');
}

export function encryptToken(plain: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(salt), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [salt, iv, tag, enc].map((b) => b.toString('base64')).join('.');
}

export function decryptToken(payload: string): string {
  const [salt, iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv(ALGO, key(salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
