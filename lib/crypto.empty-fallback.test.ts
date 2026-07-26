import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz012345');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('crypto empty / missing inputs verification', () => {
  it('encrypts and decrypts a normal token string', async () => {
    const plain = 'gho_abc123def456token';
    const encrypted = await encryptToken(plain);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plain);
    expect(encrypted.split('.')).toHaveLength(4);
    expect(await decryptToken(encrypted)).toBe(plain);
  });

  it('handles empty string encryption and decryption', async () => {
    const encrypted = await encryptToken('');
    expect(encrypted.split('.')).toHaveLength(4);
    expect(await decryptToken(encrypted)).toBe('');
  });

  it('rejects malformed payload with wrong number of parts', async () => {
    await expect(decryptToken('only-one-part')).rejects.toThrow();
    await expect(decryptToken('two.parts')).rejects.toThrow();
    await expect(decryptToken('a.b.c.d')).rejects.toThrow();
  });

  it('rejects payload with invalid base64', async () => {
    const payload = '!!!invalid-base64!!!.aaaa.aaaa';
    await expect(decryptToken(payload)).rejects.toThrow();
  });

  it('rejects empty payload string', async () => {
    await expect(decryptToken('')).rejects.toThrow();
  });

  it('rejects tampered ciphertext (modified encrypted part)', async () => {
    const plain = 'gho_secret_token';
    const encrypted = await encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = [parts[0], parts[1], '////'].join('.');
    await expect(decryptToken(tampered)).rejects.toThrow();
  });

  it('rejects tampered auth tag (modified tag part)', async () => {
    const plain = 'gho_secret_token';
    const encrypted = await encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = [parts[0], '////', parts[2]].join('.');
    await expect(decryptToken(tampered)).rejects.toThrow();
  });

  it('rejects tampered IV (modified iv part)', async () => {
    const plain = 'gho_secret_token';
    const encrypted = await encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = ['////', parts[1], parts[2]].join('.');
    await expect(decryptToken(tampered)).rejects.toThrow();
  });
});

describe('crypto key errors', () => {
  it('throws when ENCRYPTION_KEY is missing', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    await expect(encryptToken('test')).rejects.toThrow(/ENCRYPTION_KEY/i);
  });

  it('throws when ENCRYPTION_KEY is too short', async () => {
    vi.stubEnv('ENCRYPTION_KEY', 'short');
    await expect(encryptToken('test')).rejects.toThrow(/ENCRYPTION_KEY/i);
  });

  it('throws on decrypt with wrong key', async () => {
    const encrypted = await encryptToken('secret');
    vi.stubEnv('ENCRYPTION_KEY', 'a-different-key-that-is-32-char!!');
    await expect(decryptToken(encrypted)).rejects.toThrow();
  });
});
