import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackUserProtection, TrackUserProtection } from './track-user-protection';
import { gitHubUserValidator } from '../github/validate-user';

vi.mock('../github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

describe('TrackUserProtection Username Normalization', () => {
  beforeEach(() => {
    trackUserProtection.reset();
    vi.clearAllMocks();
    vi.mocked(gitHubUserValidator.validateUser).mockResolvedValue(true);
  });

  describe('Leading and trailing whitespace handling', () => {
    it('ignores leading and trailing whitespace in validateFormat()', () => {
      expect(trackUserProtection.validateFormat('  octocat  ')).toBe(true);
      expect(trackUserProtection.validateFormat('\toctocat\n')).toBe(true);
      expect(trackUserProtection.validateFormat('   ')).toBe(false);
    });

    it('ignores leading and trailing whitespace in isWriteAllowed() and recordWrite()', () => {
      trackUserProtection.recordWrite('  octocat  ');

      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('  octocat')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('octocat   ')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('  octocat  ')).toBe(false);
    });

    it('ignores leading and trailing whitespace in verifyAndDeduplicate()', async () => {
      trackUserProtection.recordWrite('  octocat  ');

      const result = await trackUserProtection.verifyAndDeduplicate('  octocat  ');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('COOLDOWN_ACTIVE');
    });
  });

  describe('Case-insensitivity across APIs', () => {
    it('treats usernames case-insensitively in validateFormat()', () => {
      expect(trackUserProtection.validateFormat('OctoCat')).toBe(true);
      expect(trackUserProtection.validateFormat('OCTOCAT')).toBe(true);
      expect(trackUserProtection.validateFormat('octocat')).toBe(true);
    });

    it('treats usernames case-insensitively across recordWrite() and isWriteAllowed()', () => {
      trackUserProtection.recordWrite('OctoCat');

      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('OCTOCAT')).toBe(false);
      expect(trackUserProtection.isWriteAllowed('OctoCat')).toBe(false);
    });

    it('treats usernames case-insensitively in verifyAndDeduplicate()', async () => {
      trackUserProtection.recordWrite('OctoCat');

      const result = await trackUserProtection.verifyAndDeduplicate('OCTOCAT');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('COOLDOWN_ACTIVE');
    });
  });

  describe('Consistent behavior across all public APIs', () => {
    it('behaves consistently when combining casing and whitespace variations', async () => {
      expect(trackUserProtection.validateFormat('  OctoCat  ')).toBe(true);

      trackUserProtection.recordWrite('  OctoCat  ');

      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);
      expect(trackUserProtection.isWriteAllowed(' OCTOCAT ')).toBe(false);

      const verifyResult = await trackUserProtection.verifyAndDeduplicate('\tOCTOCAT\n');
      expect(verifyResult.allowed).toBe(false);
      expect(verifyResult.reason).toBe('COOLDOWN_ACTIVE');
    });

    it('allows writes for new normalized usernames while blocking recorded variations', async () => {
      trackUserProtection.recordWrite('  OctoCat  ');

      expect(trackUserProtection.isWriteAllowed('different-user')).toBe(true);

      const allowedResult = await trackUserProtection.verifyAndDeduplicate('  Different-User  ');
      expect(allowedResult.allowed).toBe(true);
      expect(gitHubUserValidator.validateUser).toHaveBeenCalledWith('  Different-User  ');
    });
  });

  describe('Single internal entry referencing for equivalent usernames', () => {
    it('references the same internal entry for OctoCat, octocat, and OCTOCAT', () => {
      trackUserProtection.recordWrite('OctoCat');
      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(false);

      // Overwriting with equivalent username variation
      trackUserProtection.recordWrite('  octocat  ');
      expect(trackUserProtection.isWriteAllowed('OCTOCAT')).toBe(false);

      trackUserProtection.recordWrite('OCTOCAT');
      expect(trackUserProtection.isWriteAllowed('OctoCat')).toBe(false);
    });

    it('clears internal entries for all equivalent variations on reset()', () => {
      trackUserProtection.recordWrite('  OctoCat  ');
      expect(trackUserProtection.isWriteAllowed('OCTOCAT')).toBe(false);

      trackUserProtection.reset();

      expect(trackUserProtection.isWriteAllowed('octocat')).toBe(true);
      expect(trackUserProtection.isWriteAllowed('OCTOCAT')).toBe(true);
      expect(trackUserProtection.isWriteAllowed('  OctoCat  ')).toBe(true);
    });

    it('works correctly with direct instance from getInstance()', () => {
      const instance = TrackUserProtection.getInstance();
      instance.recordWrite('  TestUser  ');

      expect(instance.isWriteAllowed('testuser')).toBe(false);
      expect(instance.isWriteAllowed('TESTUSER')).toBe(false);
    });
  });
});
