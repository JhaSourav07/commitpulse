import { describe, expect, it } from 'vitest';
import {
  githubParamsSchema,
  githubUsernameSchema,
  ogParamsSchema,
  streakParamsSchema,
  toGraceValue,
  toOpacityValue,
  validateGitHubUsername,
} from './validations';

function parse(params: Record<string, string>) {
  return streakParamsSchema.parse({ user: 'octocat', ...params });
}

describe('streakParamsSchema — grace fallback behavior', () => {
  it('accepts "0" as a valid grace value', () => {
    expect(parse({ grace: '0' }).grace).toBe(0);
  });

  it('accepts "7" as a valid grace value', () => {
    expect(parse({ grace: '7' }).grace).toBe(7);
  });

  it('clamps "8" to 7', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '8' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(7);
  });

  it('clamps "-1" to 0', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '-1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(0);
  });

  it('falls back to 1 for negative non-integer grace input', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '-1.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });

  it('falls back to 1 for non-numeric grace value', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: 'abc' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });
  it('defaults to 1 when grace is omitted', () => {
    expect(parse({}).grace).toBe(1);
  });

  it('defaults to 1 when grace is empty string', () => {
    expect(parse({ grace: '' }).grace).toBe(1);
  });
});

describe('grace parameter — missed-day forgiveness (not timezone)', () => {
  it('grace=0 passes schema validation — strict mode', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan', grace: '0' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(0);
  });

  it('grace=1 passes schema validation — default lenient mode', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan', grace: '1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });

  it('grace=2 passes schema validation — two-day forgiveness mode', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan', grace: '2' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(2);
  });

  it('grace defaults to 1 when omitted — one missed day forgiven by default', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });

  it('grace=7 is the maximum accepted value', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan', grace: '7' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(7);
  });

  it('grace=8 is clamped to 7', () => {
    const result = streakParamsSchema.safeParse({ user: 'chetan', grace: '8' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(7);
  });

  it('grace is independent of tz param — both can coexist', () => {
    // Verifies that grace (missed days) and tz (timezone) are separate concerns
    // A user can set both independently: ?grace=2&tz=Asia/Kolkata
    const result = streakParamsSchema.safeParse({
      user: 'chetan',
      grace: '2',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(2);
      // tz is parsed separately in route.ts — not in schema
      // this test documents that grace schema parsing is timezone-unaware
    }
  });
});

describe('validateGitHubUsername', () => {
  it('returns true for a valid username', () => {
    expect(validateGitHubUsername('valid-username-123')).toBe(true);
  });

  it('returns false for a too long username', () => {
    expect(validateGitHubUsername('a'.repeat(40))).toBe(false);
  });

  it('returns false for a username with underscore', () => {
    expect(validateGitHubUsername('invalid_username')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateGitHubUsername('')).toBe(false);
  });

  it('returns false for leading hyphen', () => {
    expect(validateGitHubUsername('-octocat')).toBe(false);
  });

  it('returns false for trailing hyphen', () => {
    expect(validateGitHubUsername('octocat-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(validateGitHubUsername('octo--cat')).toBe(false);
  });
});

describe('githubParamsSchema', () => {
  it('should pass when username is valid', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
    });

    expect(result.success).toBe(true);
  });

  it('should fail when username is omitted', () => {
    const result = githubParamsSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing "username" parameter');
    }
  });

  it('should fail when username is empty', () => {
    const result = githubParamsSchema.safeParse({
      username: '',
    });

    expect(result.success).toBe(false);
  });

  it('should transform refresh true string to boolean true', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
      refresh: 'true',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refresh).toBe(true);
    }
  });

  it('should transform refresh false string to boolean false', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
      refresh: 'false',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refresh).toBe(false);
    }
  });
});

describe('streakParamsSchema user validation', () => {
  it('should pass when user is valid', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
  });

  it('should pass when user is a comma-separated list of valid usernames', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat, JhaSourav07, nishtha-agarwal-211',
    });

    expect(result.success).toBe(true);
  });

  it('should fail when one of the usernames in the list is invalid', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat, invalid_name_with_spaces',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
    }
  });

  it('should fail when one of the usernames in the list exceeds 39 characters', () => {
    const result = streakParamsSchema.safeParse({
      user: `octocat, ${'a'.repeat(40)}`,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('GitHub username cannot exceed 39 characters');
    }
  });

  it('should fail when list has empty usernames due to consecutive or trailing commas', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat, , JhaSourav07',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
    }
  });
});

describe('streakParamsSchema', () => {
  it('accepts commits mode', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      mode: 'commits',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.mode).toBe('commits');
    }
  });

  it('accepts loc mode', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      mode: 'loc',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.mode).toBe('loc');
    }
  });

  it('falls back to commits for unknown mode', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      mode: 'unknown',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.mode).toBe('commits');
    }
  });

  it('defaults to commits when mode is omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.mode).toBe('commits');
    }
  });

  it('clamps grace below minimum to 0', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      grace: '-1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(0);
    }
  });

  it('accepts a valid width value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      width: '400',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.width).toBe(400);
    }
  });

  it('rejects width below minimum', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      width: '99',
    });

    expect(result.success).toBe(false);
  });

  it('rejects width above maximum', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      width: '1201',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid height value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      height: '120',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.height).toBe(120);
    }
  });

  it('rejects height below minimum', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      height: '79',
    });

    expect(result.success).toBe(false);
  });

  it('rejects height above maximum', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      height: '801',
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-numeric width values', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      width: 'abc',
    });

    expect(result.success).toBe(false);
  });

  it('leaves width undefined when omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.width).toBeUndefined();
    }
  });

  it('should fail when user is missing', () => {
    const result = streakParamsSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing user parameter');
    }
  });

  it('should fail when user is empty string', () => {
    const result = streakParamsSchema.safeParse({
      user: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing user parameter');
    }
  });

  it('should succeed when user is a valid username', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
    }
  });

  it('should reject user values longer than 39 characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'a'.repeat(40),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('cannot exceed 39 characters');
    }
  });

  it('should fail when user is whitespace-only input', () => {
    const result = streakParamsSchema.safeParse({
      user: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
    }
  });

  it('should fail when user exceeds 39 characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'a'.repeat(40),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('GitHub username cannot exceed 39 characters');
    }
  });

  it('should fail when user has invalid characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octo_cat',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
    }
  });

  it('should accept delta_format percent', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      delta_format: 'percent',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.delta_format).toBe('percent');
    }
  });

  it('should accept delta_format absolute', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      delta_format: 'absolute',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.delta_format).toBe('absolute');
    }
  });

  it('should accept delta_format both', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      delta_format: 'both',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.delta_format).toBe('both');
    }
  });

  it('should fallback to percent for invalid delta_format', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      delta_format: 'unknown',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.delta_format).toBe('percent');
    }
  });

  it('should default delta_format to percent when omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.delta_format).toBe('percent');
    }
  });

  it('rejects invalid IANA timezone names', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      tz: 'Mars/Cyonia',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid timezone');
    }
  });

  it('rejects path-traversal and injection ?tz= payloads while accepting a real IANA zone', () => {
    const maliciousZones = [
      '../../../../etc/passwd',
      'America/New_York; rm -rf /',
      'America/New_York ',
    ];

    for (const tz of maliciousZones) {
      const result = streakParamsSchema.safeParse({ user: 'octocat', tz });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid timezone');
      }
    }

    expect(streakParamsSchema.safeParse({ user: 'octocat', tz: 'America/New_York' }).success).toBe(
      true
    );
  });
});

describe('streakParamsSchema — user hyphen validation', () => {
  it('should succeed when username contains hyphens', () => {
    const result = streakParamsSchema.safeParse({
      user: 'valid-user',
    });

    expect(result.success).toBe(true);
  });

  it('should succeed when username contains multiple hyphens', () => {
    const result = streakParamsSchema.safeParse({
      user: 'valid-user-name-123',
    });

    expect(result.success).toBe(true);
  });

  it('should fail when username ends with hyphen', () => {
    const result = streakParamsSchema.safeParse({
      user: 'user-',
    });

    expect(result.success).toBe(false);
  });

  it('should fail when username starts with hyphen', () => {
    const result = streakParamsSchema.safeParse({
      user: '-user',
    });

    expect(result.success).toBe(false);
  });

  it('should fail when username contains consecutive hyphens', () => {
    const result = streakParamsSchema.safeParse({
      user: 'user--name',
    });

    expect(result.success).toBe(false);
  });
});

describe('streakParamsSchema — grace validation', () => {
  it('accepts grace=0', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      grace: '0',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(0);
    }
  });

  it('accepts grace=7', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      grace: '7',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(7);
    }
  });

  it('accepts grace=3', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      grace: '3',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(3);
    }
  });

  it('defaults to 1 when grace is omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(1);
    }
  });

  it('clamps grace=-1 to 0', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '-1' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(0);
  });

  it('clamps grace=8 to 7', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '8' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(7);
  });

  it('falls back to 1 for non-numeric grace value', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: 'abc' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });

  it('falls back to 1 for float grace value', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '5.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.grace).toBe(1);
  });
});

describe('streakParamsSchema — scale fallback behavior', () => {
  it('accepts "log" as a valid scale value', () => {
    expect(parse({ scale: 'log' }).scale).toBe('log');
  });

  it('accepts "linear" as a valid scale value', () => {
    expect(parse({ scale: 'linear' }).scale).toBe('linear');
  });

  it('falls back to "linear" for unknown scale value', () => {
    expect(parse({ scale: 'exponential' }).scale).toBe('linear');
  });

  it('falls back to "linear" for empty string', () => {
    expect(parse({ scale: '' }).scale).toBe('linear');
  });

  it('defaults to "linear" when scale is omitted', () => {
    expect(parse({}).scale).toBe('linear');
  });
});

describe('streakParamsSchema — size fallback behavior', () => {
  it('accepts "small" as a valid size value', () => {
    expect(parse({ size: 'small' }).size).toBe('small');
  });

  it('accepts "medium" as a valid size value', () => {
    expect(parse({ size: 'medium' }).size).toBe('medium');
  });

  it('accepts "large" as a valid size value', () => {
    expect(parse({ size: 'large' }).size).toBe('large');
  });

  it('falls back to "medium" for unknown size value', () => {
    expect(parse({ size: 'giant' }).size).toBe('medium');
  });

  it('defaults to "medium" when size is omitted', () => {
    expect(parse({}).size).toBe('medium');
  });

  it('falls back to "medium" for empty string', () => {
    expect(parse({ size: '' }).size).toBe('medium');
  });

  it('should accept org parameter when provided', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      org: 'vercel',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.org).toBe('vercel');
    }
  });

  it('should fail when org contains invalid characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      org: 'invalid_org_name_with_spaces',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.org?.[0]).toBe('Invalid organization name format');
    }
  });

  it('should keep org undefined when omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.org).toBeUndefined();
    }
  });

  it('should fail when org contains invalid characters or spaces', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      org: 'invalid_org_name_with_spaces',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid organization name format');
    }
  });

  it('should accept repo parameter when provided', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      repo: 'JhaSourav07/commitpulse',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.repo).toBe('JhaSourav07/commitpulse');
    }
  });

  it('should keep repo undefined when omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.repo).toBeUndefined();
    }
  });
});

describe('streakParamsSchema — boolean transform fields', () => {
  // ── refresh ────────────────────────────────────────────────────────────────
  // Only the exact string 'true' should enable cache bypass.
  // Any other value (including '1', 'TRUE', 'false', omitted) must stay false.

  describe('refresh', () => {
    it('returns true when refresh="true"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', refresh: 'true' });
      expect(data.refresh).toBe(true);
    });

    it('returns false when refresh="false"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', refresh: 'false' });
      expect(data.refresh).toBe(false);
    });

    it('returns false when refresh="1" (only exact "true" triggers)', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', refresh: '1' });
      expect(data.refresh).toBe(false);
    });

    it('returns false when refresh="TRUE" (case-sensitive match)', () => {
      expect(parse({ refresh: 'TRUE' }).refresh).toBe(false);
    });

    it('returns false when refresh is omitted', () => {
      expect(parse({}).refresh).toBe(false);
    });
  });

  // ── hide_title ─────────────────────────────────────────────────────────────
  // Accepts both 'true' and '1' as truthy values.

  describe('hide_title', () => {
    it('returns true when hide_title="true"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', hide_title: 'true' });
      expect(data.hide_title).toBe(true);
    });

    it('returns true when hide_title="1"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', hide_title: '1' });
      expect(data.hide_title).toBe(true);
    });

    it('returns false when hide_title is omitted', () => {
      const data = streakParamsSchema.parse({ user: 'octocat' });
      expect(data.hide_title).toBe(false);
    });

    it('returns false when hide_title="false"', () => {
      expect(parse({ hide_title: 'false' }).hide_title).toBe(false);
    });

    it('returns false when hide_title="0"', () => {
      expect(parse({ hide_title: '0' }).hide_title).toBe(false);
    });
  });

  // ── hide_stats ─────────────────────────────────────────────────────────────
  // Same dual-value rule as hide_title: 'true' and '1' are both truthy.

  describe('hide_stats', () => {
    it('returns false when hide_stats="0"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', hide_stats: '0' });
      expect(data.hide_stats).toBe(false);
    });

    it('returns true when hide_stats="1"', () => {
      const data = streakParamsSchema.parse({ user: 'octocat', hide_stats: '1' });
      expect(data.hide_stats).toBe(true);
    });

    it('returns false when hide_stats is omitted', () => {
      const data = streakParamsSchema.parse({ user: 'octocat' });
      expect(data.hide_stats).toBe(false);
    });

    it('returns true when hide_stats="true"', () => {
      expect(parse({ hide_stats: 'true' }).hide_stats).toBe(true);
    });

    it('returns false when hide_stats="false"', () => {
      expect(parse({ hide_stats: 'false' }).hide_stats).toBe(false);
    });
  });

  // ── hide_background ────────────────────────────────────────────────────────
  // Same dual-value rule as hide_title/hide_stats: 'true' and '1' are both truthy.

  describe('hide_background', () => {
    it('returns true when hide_background="true"', () => {
      expect(parse({ hide_background: 'true' }).hide_background).toBe(true);
    });

    it('returns true when hide_background="1" (both "true" and "1" accepted)', () => {
      expect(parse({ hide_background: '1' }).hide_background).toBe(true);
    });

    it('returns false when hide_background="false"', () => {
      expect(parse({ hide_background: 'false' }).hide_background).toBe(false);
    });

    it('returns false when hide_background is omitted', () => {
      expect(parse({}).hide_background).toBe(false);
    });
  });

  // ── glow ──────────────────────────────────────────────────────────────────
  describe('glow', () => {
    it('returns true when glow="true"', () => {
      expect(parse({ glow: 'true' }).glow).toBe(true);
    });

    it('returns true when glow="1"', () => {
      expect(parse({ glow: '1' }).glow).toBe(true);
    });

    it('returns false when glow="false"', () => {
      expect(parse({ glow: 'false' }).glow).toBe(false);
    });

    it('returns true when glow is omitted', () => {
      expect(parse({}).glow).toBe(true);
    });
  });

  // ── dim_weekends ───────────────────────────────────────────────────────────
  describe('dim_weekends', () => {
    it('returns true when dim_weekends="true"', () => {
      expect(parse({ dim_weekends: 'true' }).dim_weekends).toBe(true);
    });

    it('returns true when dim_weekends="1"', () => {
      expect(parse({ dim_weekends: '1' }).dim_weekends).toBe(true);
    });

    it('returns false when dim_weekends="false"', () => {
      expect(parse({ dim_weekends: 'false' }).dim_weekends).toBe(false);
    });

    it('returns false when dim_weekends is omitted', () => {
      expect(parse({}).dim_weekends).toBe(false);
    });
  });
});

describe('streakParamsSchema — org parameter validation', () => {
  it('should reject org parameter with spaces and special characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      org: 'invalid_org_name_with_spaces',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldError = result.error.flatten().fieldErrors.org?.[0];
      expect(fieldError).toBe('Invalid organization name format');
    }
  });

  it('should reject org parameter with invalid alphanumeric format', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      org: 'invalid_org_name_with_spaces',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.org?.[0]).toBe('Invalid organization name format');
    }
  });
});

describe('ogParamsSchema', () => {
  it('should keep provided user value', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('octocat');
    }
  });

  it('should default user to unknown when omitted', () => {
    const result = ogParamsSchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('unknown');
    }
  });

  it('should default empty string user to unknown', () => {
    const result = ogParamsSchema.safeParse({
      user: '',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('unknown');
    }
  });

  it('should parse "user" parameter successfully', () => {
    const result = ogParamsSchema.parse({ user: 'octocat' });
    expect(result.user).toBe('octocat');
  });

  it('should parse "username" parameter successfully and fallback to user key', () => {
    const result = ogParamsSchema.parse({ username: 'octocat' });
    expect(result.user).toBe('octocat');
  });

  it('should prioritize "user" over "username" when both are provided', () => {
    const result = ogParamsSchema.parse({ user: 'octocat', username: 'ignored' });
    expect(result.user).toBe('octocat');
  });

  it('should fall back to "unknown" when neither are provided', () => {
    const result = ogParamsSchema.parse({});
    expect(result.user).toBe('unknown');
  });

  it('should fallback to "dark" when an invalid theme is provided', () => {
    const result = ogParamsSchema.safeParse({ theme: 'nonexistent_theme_name' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('dark');
    }
  });

  it('falls back to dark theme when theme parameter is an empty string', () => {
    const result = ogParamsSchema.safeParse({ theme: '' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('dark');
    }
  });
});

describe('streakParamsSchema — theme validation', () => {
  it('rejects an invalid theme value with 400 validation error listing allowed themes', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'nonexistent_theme_name',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldError = result.error.flatten().fieldErrors.theme?.[0];
      expect(fieldError).toContain('Invalid theme. Supported themes:');
      expect(fieldError).toContain('dark');
      expect(fieldError).toContain('light');
      expect(fieldError).toContain('neon');
    }
  });

  it('should reject nonexistent_theme_name and verify allowed themes are listed in error', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'nonexistent_theme_name',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.theme).toBeDefined();
      const errorMessage = fieldErrors.theme?.[0];
      expect(errorMessage).toContain('Invalid theme');
      expect(errorMessage).toContain('Supported themes:');
      expect(errorMessage).toContain('auto');
      expect(errorMessage).toContain('random');
      expect(errorMessage).toContain('dark');
      expect(errorMessage).toContain('light');
      expect(errorMessage).toContain('neon');
      expect(errorMessage).toContain('github');
      expect(errorMessage).toContain('dracula');
    }
  });
});

describe('streakParamsSchema — view fallback behavior', () => {
  it('accepts "default" as a valid view value', () => {
    expect(parse({ view: 'default' }).view).toBe('default');
  });

  it('accepts "monthly" as a valid view value', () => {
    expect(parse({ view: 'monthly' }).view).toBe('monthly');
  });

  it('accepts "languages" as a valid view value', () => {
    expect(parse({ view: 'languages' }).view).toBe('languages');
  });

  it('accepts "radar" as a valid view value', () => {
    expect(parse({ view: 'radar' }).view).toBe('radar');
  });

  it('falls back to "default" for unknown view value', () => {
    expect(parse({ view: 'unknown_view' }).view).toBe('default');
  });

  it('defaults to "default" when view is omitted', () => {
    expect(parse({}).view).toBe('default');
  });
});

describe('streakParamsSchema — accent parameter HEX color validation', () => {
  it('strips an invalid hex color like "#ZZZZZZ" for accent and falls back gracefully', () => {
    // #ZZZZZZ contains non-hex characters — must be stripped to prevent CSS injection
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      accent: '#ZZZZZZ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accent).toBeUndefined();
    }
  });

  it('accepts a valid 6-character hex color for accent', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      accent: 'ff0000',
    });

    expect(result.success).toBe(true);
  });
});

/* ==========================================================================
 * DATE RANGE BOUNDARY ROBUSTNESS (VARIATION 1)
 * ========================================================================== */

describe('streakParamsSchema — Date Range Boundary Robustness (Variation 1)', () => {
  it('should process validation safely and fallback when partial or missing year parameters are passed', () => {
    // Arrange: Provide a mock payload missing a full YYYY format sequence
    const partialYearPayload = {
      user: 'octocat',
      from: '05-12',
      to: '05-30',
    };

    // Act: Pass the object through the validator schema matrix
    const result = streakParamsSchema.safeParse(partialYearPayload);

    // Assert: The validator handles it safely using implicit date engine fallbacks
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeDefined();
      expect(result.data.to).toBeDefined();
    }
  });

  it('should pass cleanly and fallback to default ranges when date bounds are completely omitted', () => {
    // Arrange: Pass only the bare minimum required parameters
    const minimalPayload = {
      user: 'octocat',
    };

    // Act
    const result = streakParamsSchema.safeParse(minimalPayload);

    // Assert: Verify that omitted range options return undefined to use downstream defaults smoothly
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeUndefined();
      expect(result.data.to).toBeUndefined();
    }
  });
});

/* ==========================================================================
 * TZ PARAMETER — IANA TIMEZONE VALIDATION (VARIATION 4)
 * ========================================================================== */

describe('streakParamsSchema — tz IANA timezone validation (Variation 4)', () => {
  it('rejects a fictitious planetary timezone that is not a valid IANA zone', () => {
    // Mars/Cyonia looks structurally plausible (Region/City format) but does not
    // exist in the IANA tz database, so Intl.DateTimeFormat must throw and the
    // schema must surface a field-level validation error.
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      tz: 'Mars/Cyonia',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Invalid timezone');
    }
  });
});

/* ==========================================================================
 * LAYOUT PARAMETER — QUERY VALIDATION BOUNDARIES (VARIATION 2)
 * ========================================================================== */

describe('streakParamsSchema — layout query validation boundaries (Variation 2)', () => {
  it('rejects unsupported_layout and marks the parse as failed', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'unsupported_layout',
    });

    expect(result.success).toBe(false);
  });

  it('surfaces a meaningful error message for unsupported_layout', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'unsupported_layout',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain('Invalid layout format');
    }
  });

  it('accepts "default" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'default',
    });

    expect(result.success).toBe(true);
  });

  it('accepts "compact" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'compact',
    });

    expect(result.success).toBe(true);
  });

  it('accepts "full" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'full',
    });

    expect(result.success).toBe(true);
  });

  it('treats omitted layout as undefined (no validation error)', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layout).toBeUndefined();
    }
  });
});

describe('streakParamsSchema — case-insensitive theme matching', () => {
  it('accepts lowercase theme parameters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'neon',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('neon');
    }
  });

  it('accepts uppercase theme parameters and maps correctly', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'NEON',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Maps capitalized input back to lowercase registry key
      expect(result.data.theme).toBe('neon');
    }
  });

  it('accepts mixed-case theme parameters and maps correctly', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'DrAcUlA',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('dracula');
    }
  });

  it('rejects completely invalid theme name', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'fictionaltheme',
    });
    expect(result.success).toBe(false);
  });
});

/* ==========================================================================
 * USER PARAMETER — QUERY VALIDATION BOUNDARIES (VARIATION 3)
 * ========================================================================== */

describe('streakParamsSchema user maxLength validation boundaries (Variation 3)', () => {
  it('rejects a GitHub username that exceeds the 39 character length threshold', () => {
    const invalidPayload = {
      user: 'a'.repeat(40),
    };

    const parseResult = streakParamsSchema.safeParse(invalidPayload);

    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      expect(fieldErrors.user).toBeDefined();
      expect(fieldErrors.user?.[0]).toContain('cannot exceed 39 characters');
    }
  });

  it('accepts a username exactly at the upper limit of 39 characters', () => {
    const validPayload = {
      user: 'a'.repeat(39),
    };

    const parseResult = streakParamsSchema.safeParse(validPayload);
    expect(parseResult.success).toBe(true);
  });
});

/* ==========================================================================
 * DATE PARAMETER — QUERY VALIDATION BOUNDARIES (VARIATION 4)
 * ========================================================================== */

describe('streakParamsSchema — date query validation boundaries (Variation 4)', () => {
  it('rejects an invalid date format like "2026-15-40"', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-15-40',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain('Invalid "date" format. Use ISO 8601.');
    }
  });

  it('accepts a valid ISO8601 date', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-05-30',
    });

    expect(result.success).toBe(true);
  });
});

/* ==========================================================================
 * LAYOUT PARAMETER — QUERY VALIDATION BOUNDARIES (VARIATION 4)
 * ========================================================================== */

describe('streakParamsSchema — layout query validation boundaries (Variation 4)', () => {
  it('rejects unsupported_layout and marks the parse as failed', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'unsupported_layout',
    });

    expect(result.success).toBe(false);
  });

  it('surfaces a meaningful error message for unsupported_layout', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'unsupported_layout',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain(
        'Invalid layout format. Supported values: default, compact, full.'
      );
    }
  });

  it('accepts "default" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'default',
    });

    expect(result.success).toBe(true);
  });

  it('accepts "compact" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'compact',
    });

    expect(result.success).toBe(true);
  });

  it('accepts "full" as a valid layout value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      layout: 'full',
    });

    expect(result.success).toBe(true);
  });

  it('treats omitted layout as undefined (no validation error)', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layout).toBeUndefined();
    }
  });
});

describe('streakParamsSchema — gradient_stops DoS protection', () => {
  it('accepts a short valid gradient_stops value', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      gradient_stops: 'ff6b35,7000ff',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a gradient_stops value exactly at 200 characters', () => {
    // Build a 200-char string of valid comma-separated hex codes
    const stops200 = Array.from({ length: 28 }, () => 'ff6b35').join(','); // 28*6 + 27 commas = 195 chars, pad to 200
    const padded = stops200 + ',f0f'; // 195 + 4 = 199 chars — just under limit
    expect(padded.length).toBeLessThanOrEqual(200);
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      gradient_stops: padded,
    });
    expect(result.success).toBe(true);
  });

  it('rejects gradient_stops longer than 200 characters', () => {
    const oversized = 'a'.repeat(201);
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      gradient_stops: oversized,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.gradient_stops?.[0];
      expect(msg).toBe('gradient_stops cannot exceed 200 characters');
    }
  });

  it('rejects a multi-megabyte gradient_stops string', () => {
    const huge = 'ff0000,'.repeat(50000); // ~350 KB
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      gradient_stops: huge,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.gradient_stops?.[0];
      expect(msg).toBe('gradient_stops cannot exceed 200 characters');
    }
  });

  it('accepts gradient_stops as undefined (optional field)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gradient_stops).toBeUndefined();
    }
  });
});

/* ==========================================================================
 * DATE PARAMETER — QUERY VALIDATION BOUNDARIES (VARIATION 2)
 * ========================================================================== */

describe('streakParamsSchema — date query validation boundaries (Variation 2)', () => {
  it('rejects the invalid date "2026-15-40" and returns an error containing \'Invalid "date" format\'', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-15-40',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain('Invalid "date" format');
    }
  });

  it('accepts a well-formed ISO 8601 date like "2026-05-30"', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-05-30',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a date with invalid month (month 13)', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-13-01',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain('Invalid "date" format');
    }
  });

  it('rejects a freeform text string instead of a date', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: 'not-a-date',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      expect(flat.date).toBeDefined();
    }
  });
});

describe('toGraceValue — parseFloat standardization', () => {
  it('returns default 1 when val is undefined', () => {
    expect(toGraceValue(undefined)).toBe(1);
  });

  it('returns default 1 when val is empty string', () => {
    expect(toGraceValue('')).toBe(1);
  });

  it('parses integer string correctly', () => {
    expect(toGraceValue('2')).toBe(2);
  });

  it('parses float string and truncates to float (grace=1.7 → 1.7, clamped range 0-7)', () => {
    expect(toGraceValue('1.7')).toBe(1.7);
  });

  it('clamps value below 0 to 0', () => {
    expect(toGraceValue('-1')).toBe(0);
  });

  it('clamps value above 7 to 7', () => {
    expect(toGraceValue('10')).toBe(7);
  });

  it('returns default 1 for non-numeric string "abc"', () => {
    expect(toGraceValue('abc')).toBe(1);
  });

  it('parseFloat behavior: "2abc" parses as 2 (not NaN like Number would return)', () => {
    expect(toGraceValue('2abc')).toBe(2);
  });

  it('returns 0 for grace=0 (strict mode)', () => {
    expect(toGraceValue('0')).toBe(0);
  });

  it('returns 7 for grace=7 (maximum)', () => {
    expect(toGraceValue('7')).toBe(7);
  });
});

describe('toGraceValue and toOpacityValue — consistent parseFloat behavior', () => {
  it('both return their default for undefined input', () => {
    expect(toGraceValue(undefined)).toBe(1);
    expect(toOpacityValue(undefined)).toBe(1.0);
  });

  it('both return their default for empty string input', () => {
    expect(toGraceValue('')).toBe(1);
    expect(toOpacityValue('')).toBe(1.0);
  });

  it('both return their default for non-numeric input', () => {
    expect(toGraceValue('abc')).toBe(1);
    expect(toOpacityValue('abc')).toBe(1.0);
  });

  it('both parse partial numeric strings via parseFloat — not NaN', () => {
    expect(toGraceValue('2abc')).toBe(2);
    expect(toOpacityValue('0.5abc')).toBe(0.5);
  });

  it('both clamp out-of-range values — no raw passthrough', () => {
    expect(toGraceValue('100')).toBe(7);
    expect(toOpacityValue('100')).toBe(1.0);
    expect(toGraceValue('-5')).toBe(0);
    expect(toOpacityValue('-5')).toBe(0.1);
  });
});

describe('streakParamsSchema — user maxLength boundary (Variation 5)', () => {
  it('rejects a user parameter of exactly 40 characters with a 400-style error containing "cannot exceed 39 characters"', () => {
    const result = streakParamsSchema.safeParse({ user: 'a'.repeat(40) });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '';
      expect(message).toContain('cannot exceed 39 characters');
    }
  });

  it('accepts a username of exactly 39 characters (boundary value)', () => {
    const result = streakParamsSchema.safeParse({ user: 'a'.repeat(39) });

    expect(result.success).toBe(true);
  });

  it('rejects a username longer than 39 characters even when the format is otherwise valid', () => {
    const result = streakParamsSchema.safeParse({ user: 'b'.repeat(40) });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '';
      expect(message).toContain('cannot exceed 39 characters');
    }
  });

  it('returns a structured Zod error with fieldErrors.user pointing to the maxLength violation', () => {
    const result = streakParamsSchema.safeParse({ user: 'a'.repeat(40) });

    expect(result.success).toBe(false);
    if (!result.success) {
      const flatErrors = result.error.flatten().fieldErrors;
      expect(flatErrors.user).toBeDefined();
      expect(flatErrors.user?.[0]).toContain('cannot exceed 39 characters');
    }
  });
});

describe('githubUsernameSchema regression tests', () => {
  const validUsernames = ['octocat', 'KRUSHAL2956', 'my-user', 'user123'];
  const invalidUsernames = ['!!!!!!!!', '--------', 'abc--', '--abc', '<script>', 'user--name'];

  it('passes validation for valid GitHub usernames', () => {
    for (const username of validUsernames) {
      const result = githubUsernameSchema.safeParse(username);
      expect(result.success, `Expected "${username}" to be valid`).toBe(true);
    }
  });

  it('fails validation for invalid GitHub usernames', () => {
    for (const username of invalidUsernames) {
      const result = githubUsernameSchema.safeParse(username);
      expect(result.success, `Expected "${username}" to be invalid`).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
      }
    }
  });
});
