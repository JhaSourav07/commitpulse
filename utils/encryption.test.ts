import { afterEach, describe, expect, it } from 'vitest';
import { decryptToken, encryptToken } from './encryption';

describe('token encryption', () => {
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('fails closed when ENCRYPTION_KEY is missing', () => {
    expect(() => encryptToken('github-token')).toThrow(/ENCRYPTION_KEY must be configured/);
  });

  it('rejects weak encryption keys', () => {
    process.env.ENCRYPTION_KEY = 'too-short';

    expect(() => encryptToken('github-token')).toThrow(/at least 32 characters/);
  });

  it('encrypts and decrypts tokens using a versioned authenticated format', () => {
    process.env.ENCRYPTION_KEY = 'a-secure-test-key-with-at-least-32-characters';

    const encrypted = encryptToken('github-token');

    expect(encrypted).toMatch(/^v1:[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/);
    expect(encrypted).not.toContain('github-token');
    expect(decryptToken(encrypted)).toBe('github-token');
  });

  it('never silently accepts plaintext as encrypted token data', () => {
    process.env.ENCRYPTION_KEY = 'a-secure-test-key-with-at-least-32-characters';

    expect(() => decryptToken('github-token')).toThrow('Invalid encrypted token format');
  });

  it('rejects malformed IVs, tags, and ciphertext before decryption', () => {
    process.env.ENCRYPTION_KEY = 'a-secure-test-key-with-at-least-32-characters';

    expect(() => decryptToken('v1:00:00:00')).toThrow('Invalid encrypted token format');
    expect(() => decryptToken(`v1:${'z'.repeat(32)}:${'0'.repeat(32)}:${'0'.repeat(2)}`)).toThrow(
      'Invalid encrypted token format'
    );
  });

  it('rejects ciphertext encrypted with a different key', () => {
    process.env.ENCRYPTION_KEY = 'first-secure-test-key-with-at-least-32-characters';
    const encrypted = encryptToken('github-token');
    process.env.ENCRYPTION_KEY = 'second-secure-test-key-with-at-least-32-characters';

    expect(() => decryptToken(encrypted)).toThrow('Failed to decrypt token securely');
  });
});
