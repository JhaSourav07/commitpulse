import { describe, it, expect } from 'vitest';
import { streakParamsSchema, githubParamsSchema } from './validations';

// Helper — parse only the fields we care about, supplying the required `user` field.
function parse(params: Record<string, string>) {
  return streakParamsSchema.parse({ user: 'octocat', ...params });
}

describe('streakParamsSchema — boolean transform fields', () => {
  // ── refresh ────────────────────────────────────────────────────────────────
  // Only the exact string 'true' should enable cache bypass.
  // Any other value (including '1', 'TRUE', 'false', omitted) must stay false.

  describe('refresh', () => {
    it("'true' → true", () => {
      expect(parse({ refresh: 'true' }).refresh).toBe(true);
    });

    it("'false' → false", () => {
      expect(parse({ refresh: 'false' }).refresh).toBe(false);
    });

    it("'1' → false (only exact 'true' is accepted)", () => {
      expect(parse({ refresh: '1' }).refresh).toBe(false);
    });

    it("'TRUE' → false (case-sensitive match)", () => {
      expect(parse({ refresh: 'TRUE' }).refresh).toBe(false);
    });

    it('omitted → false', () => {
      expect(parse({}).refresh).toBe(false);
    });
  });

  // ── hide_title ─────────────────────────────────────────────────────────────
  // Accepts both 'true' and '1' as truthy values.

  describe('hide_title', () => {
    it("'true' → true", () => {
      expect(parse({ hide_title: 'true' }).hide_title).toBe(true);
    });

    it("'1' → true", () => {
      expect(parse({ hide_title: '1' }).hide_title).toBe(true);
    });

    it("'false' → false", () => {
      expect(parse({ hide_title: 'false' }).hide_title).toBe(false);
    });

    it("'0' → false", () => {
      expect(parse({ hide_title: '0' }).hide_title).toBe(false);
    });

    it('omitted → false', () => {
      expect(parse({}).hide_title).toBe(false);
    });
  });

  // ── hide_stats ─────────────────────────────────────────────────────────────
  // Same dual-value rule as hide_title: 'true' and '1' are both truthy.

  describe('hide_stats', () => {
    it("'true' → true", () => {
      expect(parse({ hide_stats: 'true' }).hide_stats).toBe(true);
    });

    it("'1' → true", () => {
      expect(parse({ hide_stats: '1' }).hide_stats).toBe(true);
    });

    it("'0' → false", () => {
      expect(parse({ hide_stats: '0' }).hide_stats).toBe(false);
    });

    it("'false' → false", () => {
      expect(parse({ hide_stats: 'false' }).hide_stats).toBe(false);
    });

    it('omitted → false', () => {
      expect(parse({}).hide_stats).toBe(false);
    });
  });

  // ── hide_background ────────────────────────────────────────────────────────
  // Stricter than hide_title/hide_stats — only exact 'true' is accepted,
  // '1' does NOT enable it.

  describe('hide_background', () => {
    it("'true' → true", () => {
      expect(parse({ hide_background: 'true' }).hide_background).toBe(true);
    });

    it("'1' → false (only exact 'true' accepted)", () => {
      expect(parse({ hide_background: '1' }).hide_background).toBe(false);
    });

    it("'false' → false", () => {
      expect(parse({ hide_background: 'false' }).hide_background).toBe(false);
    });

    it('omitted → false', () => {
      expect(parse({}).hide_background).toBe(false);
    });
  });
});

// ── githubParamsSchema.refresh ─────────────────────────────────────────────
// The github route has its own schema with the same refresh transform rule.

describe('githubParamsSchema — refresh transform', () => {
  it("'true' → true", () => {
    const result = githubParamsSchema.parse({ username: 'octocat', refresh: 'true' });
    expect(result.refresh).toBe(true);
  });

  it("'1' → false (only exact 'true' accepted)", () => {
    const result = githubParamsSchema.parse({ username: 'octocat', refresh: '1' });
    expect(result.refresh).toBe(false);
  });

  it('omitted → false', () => {
    const result = githubParamsSchema.parse({ username: 'octocat' });
    expect(result.refresh).toBe(false);
  });
});
