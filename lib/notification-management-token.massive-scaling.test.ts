import { describe, it, expect } from 'vitest';
import {
  createNotificationManagementToken,
  hashNotificationManagementToken,
  verifyNotificationManagementToken,
} from './notification-management-token';

describe('notification management token massive scaling', () => {
  it('handles very long token strings for hashing', () => {
    const longToken = 'cpn_' + 'a'.repeat(10_000);
    const hash = hashNotificationManagementToken(longToken);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('handles unicode characters in token strings', () => {
    const unicodeToken = 'cpn_🚀🔥commitpulse测试token値';
    const hash = hashNotificationManagementToken(unicodeToken);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifies correctly for 1000 round-trip tokens', () => {
    for (let i = 0; i < 1000; i++) {
      const token = createNotificationManagementToken();
      const hash = hashNotificationManagementToken(token);
      expect(verifyNotificationManagementToken(token, hash)).toBe(true);
    }
  });

  it('maintains uniqueness across 1000 generated tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      tokens.add(createNotificationManagementToken());
    }
    expect(tokens.size).toBe(1000);
  });

  it('produces unique hashes for unique tokens', () => {
    const hashes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      hashes.add(hashNotificationManagementToken(createNotificationManagementToken()));
    }
    expect(hashes.size).toBe(100);
  });
});
