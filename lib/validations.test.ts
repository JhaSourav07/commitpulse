import { describe, expect, it } from 'vitest';
import { githubParamsSchema, ogParamsSchema, streakParamsSchema } from './validations';

describe('streakParamsSchema — grace fallback behavior', () => {
  it('accepts "0" as a valid grace value', () => {
    expect(parse({ grace: '0' }).grace).toBe(0);
  });

  it('accepts "7" as a valid grace value', () => {
    expect(parse({ grace: '7' }).grace).toBe(7);
  });

  it('clamps "8" to 7', () => {
    expect(parse({ grace: '8' }).grace).toBe(7);
  });

  it('clamps "-1" to 0', () => {
    expect(parse({ grace: '-1' }).grace).toBe(0);
  });

  it('falls back or clamps a negative non-integer grace input safely', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      grace: '-1.5',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(0);
    }
  });

  it('falls back to 1 for non-numeric grace value', () => {
    expect(parse({ grace: 'abc' }).grace).toBe(1);
  });

  it('defaults to 1 when grace is omitted', () => {
    expect(parse({}).grace).toBe(1);
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
});

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

function parse(params: Record<string, string>) {
  return streakParamsSchema.parse({ user: 'octocat', ...params });
}

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

describe('streakParamsSchema — view fallback behavior', () => {
  it('accepts "default" as a valid view value', () => {
    expect(parse({ view: 'default' }).view).toBe('default');
  });

  it('accepts "monthly" as a valid view value', () => {
    expect(parse({ view: 'monthly' }).view).toBe('monthly');
  });

  it('falls back to "default" for unknown view value', () => {
    expect(parse({ view: 'radar' }).view).toBe('default');
  });

  it('defaults to "default" when view is omitted', () => {
    expect(parse({}).view).toBe('default');
  });
});

describe('streakParamsSchema — accent parameter HEX color validation', () => {
  it('rejects an invalid hex color like "#ZZZZZZ" for accent', () => {
    // #ZZZZZZ contains non-hex characters — must fail schema validation
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      accent: '#ZZZZZZ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid hex color like "#ZZZZZZ" for accent (Variation 4)', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      accent: '#ZZZZZZ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects the invalid boundary hex color "#ZZZZZZ" for accent', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      accent: '#ZZZZZZ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'accent must be a valid 3 or 6 character hex color without #'
      );
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

describe('streakParamsSchema — date parameter validation', () => {
  it('rejects an invalid ISO8601 calendar date format like "2026-15-40"', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      date: '2026-15-40',
    });

    expect(result.success).toBe(false);
  });
});
