import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz012345');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('crypto empty / missing inputs verification', () => {
  it('encrypts and decrypts a normal token string', () => {
    const plain = 'gho_abc123def456token';
    const encrypted = encryptToken(plain);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plain);
    expect(encrypted.split('.')).toHaveLength(4);
    expect(decryptToken(encrypted)).toBe(plain);
  });

  it('handles empty string encryption and decryption', () => {
    const encrypted = encryptToken('');
    expect(encrypted.split('.')).toHaveLength(4);
    expect(decryptToken(encrypted)).toBe('');
  });

  it('rejects malformed payload with wrong number of parts', () => {
    expect(() => decryptToken('only-one-part')).toThrow();
    expect(() => decryptToken('two.parts')).toThrow();
    expect(() => decryptToken('a.b.c.d')).toThrow();
  });

  it('rejects payload with invalid base64', () => {
    const payload = '!!!invalid-base64!!!.aaaa.aaaa';
    expect(() => decryptToken(payload)).toThrow();
  });

  it('rejects empty payload string', () => {
    expect(() => decryptToken('')).toThrow();
  });

  it('rejects tampered ciphertext (modified encrypted part)', () => {
    const plain = 'gho_secret_token';
    const encrypted = encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = [parts[0], parts[1], '////'].join('.');
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('rejects tampered auth tag (modified tag part)', () => {
    const plain = 'gho_secret_token';
    const encrypted = encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = [parts[0], '////', parts[2]].join('.');
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('rejects tampered IV (modified iv part)', () => {
    const plain = 'gho_secret_token';
    const encrypted = encryptToken(plain);
    const parts = encrypted.split('.');
    const tampered = ['////', parts[1], parts[2]].join('.');
    expect(() => decryptToken(tampered)).toThrow();
  });
});

describe('crypto key errors', () => {
  it('throws when ENCRYPTION_KEY is missing', () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    expect(() => encryptToken('test')).toThrow(/ENCRYPTION_KEY/i);
  });

  it('throws when ENCRYPTION_KEY is too short', () => {
    vi.stubEnv('ENCRYPTION_KEY', 'short');
    expect(() => encryptToken('test')).toThrow(/ENCRYPTION_KEY/i);
  });

  it('throws on decrypt with wrong key', () => {
    const encrypted = encryptToken('secret');
    vi.stubEnv('ENCRYPTION_KEY', 'a-different-key-that-is-32-char!!');
    expect(() => decryptToken(encrypted)).toThrow();
  });
});
