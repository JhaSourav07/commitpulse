import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz012345');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('crypto massive scaling', () => {
  it('handles very long token strings without truncation', async () => {
    const long = 'a'.repeat(10_000);
    const encrypted = await encryptToken(long);
    expect(await decryptToken(encrypted)).toBe(long);
  });

  it('handles unicode characters including emoji', async () => {
    const unicode = '🚀🔥💯 commitpulse 测试 テスト тест';
    const encrypted = await encryptToken(unicode);
    expect(await decryptToken(encrypted)).toBe(unicode);
  });

  it('handles strings with special characters', async () => {
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
    const encrypted = await encryptToken(special);
    expect(await decryptToken(encrypted)).toBe(special);
  });

  it('handles JSON-serialized payload', async () => {
    const payload = JSON.stringify({
      access_token: 'gho_xxx',
      scope: 'repo,user',
      token_type: 'bearer',
    });
    const encrypted = await encryptToken(payload);
    expect(await decryptToken(encrypted)).toBe(payload);
  });

  it('maintains round-trip integrity for repeated encryptions of same plaintext (different IV)', async () => {
    const plain = 'gho_consistent_token_value';
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(await encryptToken(plain));
    }
    expect(results.size).toBe(10);
    for (const enc of Array.from(results)) {
      expect(await decryptToken(enc)).toBe(plain);
    }
  });

  it('handles maximum token length (512 bytes) typical for GitHub tokens', async () => {
    const typical = 'ghp_' + 'a'.repeat(508);
    expect(typical.length).toBe(512);
    const encrypted = await encryptToken(typical);
    expect(await decryptToken(encrypted)).toBe(typical);
  });
});
