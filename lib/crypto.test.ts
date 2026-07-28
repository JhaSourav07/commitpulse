import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { encryptToken, decryptToken } from './crypto';

const KEY = process.env.ENCRYPTION_KEY;
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(32);
});
afterAll(() => {
  process.env.ENCRYPTION_KEY = KEY ?? '';
});

describe('encryptToken / decryptToken', () => {
  it('round-trips a plain text token', async () => {
    const plain = 'ghp_test123token';
    const enc = await encryptToken(plain);
    expect(enc).not.toBe(plain);
    expect(await decryptToken(enc)).toBe(plain);
  });

  it('produces different ciphertexts for the same input (random salt/IV)', async () => {
    const plain = 'same-value';
    const a = await encryptToken(plain);
    const b = await encryptToken(plain);
    expect(a).not.toBe(b);
  });

  it('rejects a tampered ciphertext', async () => {
    const enc = await encryptToken('secret');
    const parts = enc.split('.');
    parts[2] = Buffer.from('ffffffffffffffff').toString('base64');
    await expect(decryptToken(parts.join('.'))).rejects.toThrow();
  });

  it('throws on invalid payload format', async () => {
    await expect(decryptToken('not-a-valid-format')).rejects.toThrow();
  });

  it('handles empty string', async () => {
    const enc = await encryptToken('');
    expect(await decryptToken(enc)).toBe('');
  });

  it('handles special characters', async () => {
    const plain = 'abc123!@#$%^&*()_+=-[]{}|;:,.<>?/~`';
    expect(await decryptToken(await encryptToken(plain))).toBe(plain);
  });

  it('throws when ENCRYPTION_KEY is missing', async () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    await expect(encryptToken('x')).rejects.toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });

  it('throws when ENCRYPTION_KEY is too short', async () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'short';
    await expect(encryptToken('x')).rejects.toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });
});
