import { describe, expect, it } from 'vitest';
import { githubParamsSchema, ogParamsSchema, streakParamsSchema } from './validations';

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

describe('streakParamsSchema', () => {
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

  it('should keep org undefined when omitted', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.org).toBeUndefined();
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
  // Stricter than hide_title/hide_stats — only exact 'true' is accepted,
  // '1' does NOT enable it.

  describe('hide_background', () => {
    it('returns true when hide_background="true"', () => {
      expect(parse({ hide_background: 'true' }).hide_background).toBe(true);
    });

    it('returns false when hide_background="1" (only exact "true" accepted)', () => {
      expect(parse({ hide_background: '1' }).hide_background).toBe(false);
    });

    it('returns false when hide_background="false"', () => {
      expect(parse({ hide_background: 'false' }).hide_background).toBe(false);
    });

    it('returns false when hide_background is omitted', () => {
      expect(parse({}).hide_background).toBe(false);
    });
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
});
