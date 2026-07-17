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
  it('round-trips a plain text token', () => {
    const plain = 'ghp_test123token';
    const enc = encryptToken(plain);
    expect(enc).not.toBe(plain);
    expect(decryptToken(enc)).toBe(plain);
  });

  it('produces different ciphertexts for the same input (random salt/IV)', () => {
    const plain = 'same-value';
    const a = encryptToken(plain);
    const b = encryptToken(plain);
    expect(a).not.toBe(b);
  });

  it('rejects a tampered ciphertext', () => {
    const enc = encryptToken('secret');
    const parts = enc.split('.');
    parts[2] = Buffer.from('ffffffffffffffff').toString('base64');
    expect(() => decryptToken(parts.join('.'))).toThrow();
  });

  it('throws on invalid payload format', () => {
    expect(() => decryptToken('not-a-valid-format')).toThrow();
  });

  it('handles empty string', () => {
    const enc = encryptToken('');
    expect(decryptToken(enc)).toBe('');
  });

  it('handles special characters', () => {
    const plain = 'abc123!@#$%^&*()_+=-[]{}|;:,.<>?/~`';
    expect(decryptToken(encryptToken(plain))).toBe(plain);
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptToken('x')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });

  it('throws when ENCRYPTION_KEY is too short', () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'short';
    expect(() => encryptToken('x')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });
});
