import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz012345');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('crypto massive scaling', () => {
  it('handles very long token strings without truncation', () => {
    const long = 'a'.repeat(10_000);
    const encrypted = encryptToken(long);
    expect(decryptToken(encrypted)).toBe(long);
  });

  it('handles unicode characters including emoji', () => {
    const unicode = '🚀🔥💯 commitpulse 测试 テスト тест';
    const encrypted = encryptToken(unicode);
    expect(decryptToken(encrypted)).toBe(unicode);
  });

  it('handles strings with special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
    const encrypted = encryptToken(special);
    expect(decryptToken(encrypted)).toBe(special);
  });

  it('handles JSON-serialized payload', () => {
    const payload = JSON.stringify({
      access_token: 'gho_xxx',
      scope: 'repo,user',
      token_type: 'bearer',
    });
    const encrypted = encryptToken(payload);
    expect(decryptToken(encrypted)).toBe(payload);
  });

  it('maintains round-trip integrity for repeated encryptions of same plaintext (different IV)', () => {
    const plain = 'gho_consistent_token_value';
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(encryptToken(plain));
    }
    expect(results.size).toBe(10);
    results.forEach((enc) => {
      expect(decryptToken(enc)).toBe(plain);
    });
  });

  it('handles maximum token length (512 bytes) typical for GitHub tokens', () => {
    const typical = 'ghp_' + 'a'.repeat(508);
    expect(typical.length).toBe(512);
    const encrypted = encryptToken(typical);
    expect(decryptToken(encrypted)).toBe(typical);
  });
});
