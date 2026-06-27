import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackUserProtection, trackUserProtection } from './track-user-protection';
import { gitHubUserValidator } from '../github/validate-user';

vi.mock('../github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

describe('TrackUserProtection', () => {
  beforeEach(() => {
    trackUserProtection.reset();
    vi.clearAllMocks();
  });

  describe('Mock incoming request telemetry', () => {
    it('records and exposes write timestamps as telemetry for incoming requests', () => {
      const telemetry: { username: string; timestamp: number }[] = [];

      const recordWithTelemetry = (username: string) => {
        trackUserProtection.recordWrite(username);
        telemetry.push({ username: username.trim().toLowerCase(), timestamp: Date.now() });
      };

      recordWithTelemetry('octocat');
      recordWithTelemetry('github-user');

      expect(telemetry).toHaveLength(2);
      expect(telemetry[0].username).toBe('octocat');
      expect(telemetry[1].username).toBe('github-user');
      expect(telemetry[0].timestamp).toBeLessThanOrEqual(Date.now());

      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('github-user')).toBe(false);
    });
  });

  describe('Scraper pattern detection', () => {
    it('triggers protection flags for invalid bot-injected username patterns', () => {
      const scraperPatterns = [
        '../../etc/passwd',
        'a'.repeat(40),
        '-invalid-start',
        'invalid-end-',
        'user name',
        '',
        '  ',
      ];

      for (const pattern of scraperPatterns) {
        const isValid = trackUserProtection.validateFormat(pattern);
        expect(isValid, `Expected "${pattern}" to be flagged as invalid`).toBe(false);
      }
    });
  });

  describe('Blocked request logging', () => {
    it('logs and returns structured reasons for all blocked request categories', async () => {
      const blockedLog: { username: string; reason: string }[] = [];

      const intercept = async (username: string) => {
        const result = await trackUserProtection.verifyAndDeduplicate(username);
        if (!result.allowed && result.reason) {
          blockedLog.push({ username, reason: result.reason });
        }
        return result;
      };

      const formatResult = await intercept('-bad-format-');
      expect(formatResult.reason).toBe('INVALID_FORMAT');

      trackUserProtection.recordWrite('octocat');
      const cooldownResult = await intercept('octocat');
      expect(cooldownResult.reason).toBe('COOLDOWN_ACTIVE');

      vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(false);
      const notFoundResult = await intercept('ghost-user-404');
      expect(notFoundResult.reason).toBe('USER_NOT_FOUND');

      expect(blockedLog).toHaveLength(3);
      expect(blockedLog.map((e) => e.reason)).toEqual([
        'INVALID_FORMAT',
        'COOLDOWN_ACTIVE',
        'USER_NOT_FOUND',
      ]);
    });
  });

  describe('Whitelist overrides for verified partners', () => {
    it('allows verified partner usernames to bypass cooldown via reset and re-verify', async () => {
      const VERIFIED_PARTNERS = new Set(['partner-org', 'trusted-bot']);

      const verifyWithWhitelist = async (username: string): Promise<boolean> => {
        if (VERIFIED_PARTNERS.has(username.trim().toLowerCase())) {
          trackUserProtection.reset();
          vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);
          const result = await trackUserProtection.verifyAndDeduplicate(username);
          return result.allowed;
        }
        const result = await trackUserProtection.verifyAndDeduplicate(username);
        return result.allowed;
      };

      trackUserProtection.recordWrite('partner-org');
      expect(trackUserProtection.isWriteAllowed('partner-org')).toBe(false);

      const whitelistAllowed = await verifyWithWhitelist('partner-org');
      expect(whitelistAllowed).toBe(true);

      trackUserProtection.recordWrite('regular-user');
      const regularAllowed = await verifyWithWhitelist('regular-user');
      expect(regularAllowed).toBe(false);
    });
  });

  describe('Recovery rate on IP protection logs', () => {
    it('calculates cooldown recovery rate across a batch of flagged usernames', () => {
      const flaggedUsers = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'];

      for (const user of flaggedUsers) {
        trackUserProtection.recordWrite(user);
      }

      const initiallyBlocked = flaggedUsers.filter((u) => !trackUserProtection.isWriteAllowed(u));
      expect(initiallyBlocked).toHaveLength(flaggedUsers.length);

      trackUserProtection.reset();

      const recovered = flaggedUsers.filter((u) => trackUserProtection.isWriteAllowed(u));
      const recoveryRate = recovered.length / flaggedUsers.length;

      expect(recovered).toHaveLength(flaggedUsers.length);
      expect(recoveryRate).toBe(1.0);
    });
  });

  describe('Singleton instance', () => {
    it('returns the same instance across multiple getInstance() calls', () => {
      const instanceA = TrackUserProtection.getInstance();
      const instanceB = TrackUserProtection.getInstance();
      expect(instanceA).toBe(instanceB);
    });
  });
});
