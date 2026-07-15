import { describe, it, expect } from 'vitest';
import { TECHNOLOGIES, TECH_CATEGORIES, getTechById } from './technologies';

describe('technologies - hydration stability, exception safety & error fallbacks (Variation 6)', () => {
  // Case 1: Unexpected/malformed lookups should not throw runtime exceptions.
  it('does not throw when given unexpected or malformed ids', () => {
    const malformedInputs: unknown[] = [
      null,
      undefined,
      '',
      12345,
      {},
      [],
      Symbol('id'),
      '   ',
      'JAVASCRIPT', // wrong casing
    ];

    for (const input of malformedInputs) {
      expect(() => getTechById(input as string)).not.toThrow();
    }
  });

  // Case 2: Lookup calls are safely boundary-wrapped, no uncaught exceptions propagate.
  it('safely wraps lookups so failures never crash the caller', () => {
    let caughtError: unknown = null;
    try {
      getTechById(undefined as unknown as string);
      getTechById({ malicious: true } as unknown as string);
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeNull();
  });

  // Case 3: Missing/invalid ids fall back cleanly to undefined instead of crashing.
  it('returns a clean undefined fallback instead of crashing for missing ids', () => {
    expect(getTechById('non-existent-tech')).toBeUndefined();
    expect(getTechById('')).toBeUndefined();
    expect(getTechById('   ')).toBeUndefined();
  });

  // Case 4: Repeated lookups remain stable/idempotent (hydration-safe: no side effects or mutation).
  it('remains stable and idempotent across repeated lookups', () => {
    const first = getTechById('javascript');
    const second = getTechById('javascript');
    const third = getTechById('javascript');

    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(TECHNOLOGIES.length).toBeGreaterThan(0);

    // Calling the lookup repeatedly must not mutate the underlying dataset.
    const originalLength = TECHNOLOGIES.length;
    getTechById('javascript');
    getTechById('nonexistent');
    expect(TECHNOLOGIES.length).toBe(originalLength);
  });

  // Case 5: A failed/invalid lookup does not block subsequent valid lookups (recovery path).
  it('recovers cleanly after a failed lookup, allowing subsequent valid lookups to succeed', () => {
    const failed = getTechById('does-not-exist');
    expect(failed).toBeUndefined();

    const recovered = getTechById('typescript');
    expect(recovered).toBeDefined();
    expect(recovered?.id).toBe('typescript');
    expect(recovered?.name).toBe('TypeScript');

    // Data integrity: every technology has required fields and a valid category.
    for (const tech of TECHNOLOGIES) {
      expect(tech.id).toBeTruthy();
      expect(tech.name).toBeTruthy();
      expect(TECH_CATEGORIES).toContain(tech.category);
    }
  });
});
