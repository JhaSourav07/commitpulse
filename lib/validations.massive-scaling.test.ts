import { describe, it, expect } from 'vitest';
import {
  streakParamsSchema,
  compareParamsSchema,
  reviewPostSchema,
  toGraceValue,
  toOpacityValue,
  toDimensionValue,
  toBooleanFlag,
  toGlowFlag,
  GITHUB_USERNAME_REGEX,
} from './validations';

function makeStreakParams(user: string, overrides: Record<string, string> = {}) {
  return { user, theme: 'dark', scale: 'linear', ...overrides };
}

/** Measures synchronous execution time in milliseconds. */
function measureMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// ---------------------------------------------------------------------------
// 5 core massive-scaling test cases
// ---------------------------------------------------------------------------

describe('validations - Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('bulk parse: streakParamsSchema handles 1 000 valid parameter objects within 500 ms', () => {
    const BATCH = 1_000;

    const elapsed = measureMs(() => {
      for (let i = 0; i < BATCH; i++) {
        const result = streakParamsSchema.safeParse(
          makeStreakParams(`user${i}`, {
            bg: '0d1117',
            accent: '00ffaa',
            text: 'ffffff',
            scale: i % 2 === 0 ? 'linear' : 'log',
            size: ['small', 'medium', 'large'][i % 3],
            speed: `${(i % 19) + 2}s`,
            grace: String(i % 8), // 0–7
          })
        );
        // Every parse must succeed — no silent failures under load
        expect(result.success).toBe(true);
      }
    });

    // Performance guard: 1 000 parses must complete well under 500 ms
    expect(elapsed).toBeLessThan(500);
  });

  it('extreme bound clamping: grace values at 0, 7, and out-of-range inputs clamp correctly at scale', () => {
    // Boundary values
    expect(toGraceValue('0')).toBe(0);
    expect(toGraceValue('7')).toBe(7);

    // Out-of-range — must clamp, not throw or return NaN
    expect(toGraceValue('100')).toBe(7);
    expect(toGraceValue('-5')).toBe(0);
    expect(toGraceValue('999')).toBe(7);

    // Non-numeric — must fall back to default of 1
    expect(toGraceValue('abc')).toBe(1);
    expect(toGraceValue('')).toBe(1);
    expect(toGraceValue(undefined)).toBe(1);

    // Float inputs — parseFloat('2.9') = 2.9, clamped to [0,7]
    expect(toGraceValue('2.9')).toBeCloseTo(2.9);
    expect(toGraceValue('7.1')).toBe(7); // clamped at upper bound
  });

  it('dimension params: width and height accept max-bound values and reject values outside [100,1200] / [80,800]', () => {
    // Max valid dimensions
    const maxWidth = streakParamsSchema.safeParse(makeStreakParams('octocat', { width: '1200' }));
    const maxHeight = streakParamsSchema.safeParse(makeStreakParams('octocat', { height: '800' }));
    expect(maxWidth.success).toBe(true);
    expect(maxHeight.success).toBe(true);

    // Min valid dimensions
    const minWidth = streakParamsSchema.safeParse(makeStreakParams('octocat', { width: '100' }));
    const minHeight = streakParamsSchema.safeParse(makeStreakParams('octocat', { height: '80' }));
    expect(minWidth.success).toBe(true);
    expect(minHeight.success).toBe(true);

    // Overflow dimensions — must fail validation, not silently truncate
    const overWidth = streakParamsSchema.safeParse(makeStreakParams('octocat', { width: '9999' }));
    const overHeight = streakParamsSchema.safeParse(
      makeStreakParams('octocat', { height: '99999' })
    );
    expect(overWidth.success).toBe(false);
    expect(overHeight.success).toBe(false);
  });

  it('bulk parse: reviewPostSchema validates 500 review submissions within 300 ms without errors', () => {
    const BATCH = 500;

    const elapsed = measureMs(() => {
      for (let i = 0; i < BATCH; i++) {
        const result = reviewPostSchema.safeParse({
          name: `Contributor ${i}`,
          handle: `@user_${i}`,
          platform: i % 2 === 0 ? 'twitter' : 'github',
          message: `This is a test review message number ${i} that is long enough.`,
          accentColor: '#10b981',
        });
        expect(result.success).toBe(true);
      }
    });

    // 500 review parses must complete well under 300 ms
    expect(elapsed).toBeLessThan(300);
  });

  it('compareParamsSchema: rejects self-comparison at scale across 200 username variants', () => {
    const elapsed = measureMs(() => {
      for (let i = 0; i < 200; i++) {
        const username = `user${i}`;
        const result = compareParamsSchema.safeParse({ user1: username, user2: username });
        // Self-comparison must always be rejected — no bypass under load
        expect(result.success).toBe(false);
      }
    });

    expect(elapsed).toBeLessThan(200);
  });

  // ---------------------------------------------------------------------------
  // Extra tests — edge cases for quality:exceptional
  // ---------------------------------------------------------------------------

  it('EDGE: GITHUB_USERNAME_REGEX is ReDoS-safe — catastrophic backtrack inputs resolve instantly', () => {
    /**
     * Non-obvious: regex with alternation on similar character classes can
     * exhibit exponential backtracking (ReDoS) on crafted inputs. We verify
     * the regex completes in < 50 ms even for the worst-case pattern.
     *
     * Worst-case pattern for ReDoS: long string of valid chars ending in
     * an invalid char that forces backtracking across all alternations.
     */
    const malicious = 'a'.repeat(38) + '!'; // 39 chars ending with invalid char

    const elapsed = measureMs(() => {
      for (let i = 0; i < 1_000; i++) {
        GITHUB_USERNAME_REGEX.test(malicious);
      }
    });

    // 1 000 regex tests on the adversarial input must finish under 50 ms
    expect(elapsed).toBeLessThan(50);
    expect(GITHUB_USERNAME_REGEX.test(malicious)).toBe(false);
  });

  it('EDGE: comma-separated accent array is capped at 4 elements regardless of input length', () => {
    /**
     * Non-obvious: the accent transform slices to 4 elements but this is
     * never explicitly tested. A gradient with 10 accent colors must not
     * cause an array overflow or include extra elements that break SVG
     * gradient stop generation.
     */
    const tenColors = Array.from({ length: 10 }, (_, i) => `${i.toString(16).padStart(6, '0')}`);
    const result = streakParamsSchema.safeParse(
      makeStreakParams('octocat', { accent: tenColors.join(',') })
    );

    expect(result.success).toBe(true);
    if (result.success && Array.isArray(result.data.accent)) {
      // Must be capped at 4 — not 10
      expect(result.data.accent.length).toBeLessThanOrEqual(4);
    }
  });

  it('EDGE: opacity transform clamps to [0.1, 1.0] and never produces 0 or negative values', () => {
    /**
     * Non-obvious: opacity=0 would make the entire SVG invisible. The lower
     * bound must be 0.1, not 0. This is easy to miss when reading the code
     * since Math.max(0.1, ...) is buried inside toOpacityValue.
     */
    expect(toOpacityValue('0')).toBe(0.1); // must NOT be 0
    expect(toOpacityValue('-1')).toBe(0.1); // must NOT be negative
    expect(toOpacityValue('0.05')).toBe(0.1); // below min — clamps up
    expect(toOpacityValue('1.0')).toBe(1.0);
    expect(toOpacityValue('1.5')).toBe(1.0); // above max — clamps down
    expect(toOpacityValue(undefined)).toBe(1.0); // default
    expect(toOpacityValue('abc')).toBe(1.0); // non-numeric default
  });

  it('EDGE: toBooleanFlag and toGlowFlag handle all truthy/falsy string variants correctly', () => {
    /**
     * Non-obvious: toGlowFlag defaults to TRUE (glow on by default) unlike
     * toBooleanFlag which defaults to FALSE. Mixing these up causes glow to
     * always be off or hide_title to always be on — silent rendering bugs.
     */

    // toBooleanFlag: only 'true' and '1' are truthy
    expect(toBooleanFlag('true')).toBe(true);
    expect(toBooleanFlag('1')).toBe(true);
    expect(toBooleanFlag('false')).toBe(false);
    expect(toBooleanFlag('0')).toBe(false);
    expect(toBooleanFlag(undefined)).toBe(false);
    expect(toBooleanFlag('')).toBe(false);

    // toGlowFlag: undefined defaults to TRUE (glow is on by default)
    expect(toGlowFlag(undefined)).toBe(true); // default ON — different from toBooleanFlag
    expect(toGlowFlag('true')).toBe(true);
    expect(toGlowFlag('1')).toBe(true);
    expect(toGlowFlag('false')).toBe(false);
    expect(toGlowFlag('0')).toBe(false);
    expect(toGlowFlag('')).toBe(false);
  });

  it('EDGE: toDimensionValue returns undefined for undefined input and numeric value for valid strings', () => {
    /**
     * Non-obvious: toDimensionValue(undefined) must return undefined (not 0
     * or NaN) so that downstream code can distinguish "not provided" from
     * "provided as 0", which maps to different SVG canvas behaviours.
     */
    expect(toDimensionValue(undefined)).toBeUndefined();
    expect(toDimensionValue('400')).toBe(400);
    expect(toDimensionValue('0')).toBe(0);
  });
});
