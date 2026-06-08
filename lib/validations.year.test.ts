import { describe, it, expect } from 'vitest';
import { streakParamsSchema, wrappedParamsSchema } from './validations';

const CURRENT_YEAR = new Date().getFullYear();
const EXPECTED_ERROR = 'GitHub was founded in 2008. Please provide a year of 2008 or later.';

function getYearError(result: {
  success: false;
  error: { issues: { path: PropertyKey[]; message: string }[] };
}): string | undefined {
  return result.error.issues.find((i) => i.path.join('.') === 'year')?.message;
}

describe('streakParamsSchema — year validation boundaries', () => {
  it('accepts year 2008 (GitHub founding year — lower boundary)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2008' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe('2008');
    }
  });

  it('accepts the current year (upper boundary)', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      year: String(CURRENT_YEAR),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(String(CURRENT_YEAR));
    }
  });

  it('accepts a year between 2008 and current year', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2020' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe('2020');
    }
  });

  it('allows year to be omitted (optional field)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBeUndefined();
    }
  });

  it('rejects year 2007 (one year before GitHub founding)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2007' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects year 2000 (well before GitHub)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2000' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects year 0001 (ancient year)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '0001' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it(`rejects year ${CURRENT_YEAR + 1} (one year in the future)`, () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      year: String(CURRENT_YEAR + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it(`rejects year ${CURRENT_YEAR + 10} (far future)`, () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      year: String(CURRENT_YEAR + 10),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects non-numeric input like "abcd"', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: 'abcd' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects 3-digit input "999" (fails /^\\d{4}$/ format)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '999' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects 5-digit input "20008" (fails /^\\d{4}$/ format)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '20008' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects negative input "-2020"', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '-2020' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects decimal input "2020.5"', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2020.5' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects input with spaces " 2020 "', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: ' 2020 ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });
});

describe('wrappedParamsSchema — year validation boundaries', () => {
  it('accepts year 2008 (lower boundary)', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: '2008' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe('2008');
    }
  });

  it('accepts the current year (upper boundary)', () => {
    const result = wrappedParamsSchema.safeParse({
      user: 'octocat',
      year: String(CURRENT_YEAR),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(String(CURRENT_YEAR));
    }
  });

  it('allows year to be omitted (optional field)', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBeUndefined();
    }
  });

  it('rejects year 2007 and produces the exact error message', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: '2007' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it(`rejects year ${CURRENT_YEAR + 1} (one year in the future)`, () => {
    const result = wrappedParamsSchema.safeParse({
      user: 'octocat',
      year: String(CURRENT_YEAR + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects non-numeric input "abcd"', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: 'abcd' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects 3-digit input "999" (fails /^\\d{4}$/ format)', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: '999' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects negative input "-2020"', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: '-2020' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });

  it('rejects decimal input "2020.5"', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat', year: '2020.5' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getYearError(result)).toBe(EXPECTED_ERROR);
    }
  });
});

describe('year validation — cross-schema consistency', () => {
  const boundaryYears = ['2007', '2008', String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

  it.each(boundaryYears)('both schemas agree on year %s', (year) => {
    const streakResult = streakParamsSchema.safeParse({ user: 'octocat', year });
    const wrappedResult = wrappedParamsSchema.safeParse({ user: 'octocat', year });

    expect(streakResult.success).toBe(wrappedResult.success);

    if (!streakResult.success && !wrappedResult.success) {
      expect(getYearError(streakResult)).toBe(getYearError(wrappedResult));
    }
  });
});
