import { describe, it, expect } from 'vitest';
import { detectBreakingChanges } from './detectBreakingChanges';
import type { ApiField } from './extractBadgeParams';

describe('detectBreakingChanges', () => {
  it('reports no changes and a patch bump when the contract is unchanged', () => {
    const fields: ApiField[] = [{ name: 'user', optional: false, typeText: 'string' }];

    const report = detectBreakingChanges(fields, fields);

    expect(report.changes).toEqual([]);
    expect(report.breakingChanges).toEqual([]);
    expect(report.recommendedBump).toBe('patch');
  });

  it('flags a removed field as breaking and recommends a major bump', () => {
    const base: ApiField[] = [
      { name: 'user', optional: false, typeText: 'string' },
      { name: 'legacyParam', optional: true, typeText: 'string' },
    ];
    const current: ApiField[] = [{ name: 'user', optional: false, typeText: 'string' }];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toHaveLength(1);
    expect(report.breakingChanges[0]).toMatchObject({
      kind: 'field-removed',
      field: 'legacyParam',
    });
    expect(report.recommendedBump).toBe('major');
  });

  it('flags an optional field becoming required as breaking', () => {
    const base: ApiField[] = [{ name: 'theme', optional: true, typeText: 'string' }];
    const current: ApiField[] = [{ name: 'theme', optional: false, typeText: 'string' }];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toHaveLength(1);
    expect(report.breakingChanges[0].kind).toBe('field-now-required');
    expect(report.recommendedBump).toBe('major');
  });

  it('does not flag a required field becoming optional as breaking', () => {
    const base: ApiField[] = [{ name: 'grace', optional: false, typeText: 'number' }];
    const current: ApiField[] = [{ name: 'grace', optional: true, typeText: 'number' }];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toEqual([]);
    expect(report.changes[0].kind).toBe('field-now-optional');
    expect(report.recommendedBump).toBe('minor');
  });

  it('treats adding a new optional field as a safe minor change', () => {
    const base: ApiField[] = [{ name: 'user', optional: false, typeText: 'string' }];
    const current: ApiField[] = [
      { name: 'user', optional: false, typeText: 'string' },
      { name: 'newFeatureFlag', optional: true, typeText: 'boolean' },
    ];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toEqual([]);
    expect(report.changes[0]).toMatchObject({ kind: 'field-added', field: 'newFeatureFlag' });
    expect(report.recommendedBump).toBe('minor');
  });

  it('treats widening a union type as safe (existing values still accepted)', () => {
    const base: ApiField[] = [{ name: 'scale', optional: false, typeText: "'linear' | 'log'" }];
    const current: ApiField[] = [
      { name: 'scale', optional: false, typeText: "'linear' | 'log' | 'sqrt'" },
    ];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toEqual([]);
    expect(report.changes[0].kind).toBe('field-type-widened');
    expect(report.recommendedBump).toBe('minor');
  });

  it('treats narrowing a union type as breaking (previously valid values now rejected)', () => {
    const base: ApiField[] = [
      { name: 'scale', optional: false, typeText: "'linear' | 'log' | 'sqrt'" },
    ];
    const current: ApiField[] = [{ name: 'scale', optional: false, typeText: "'linear' | 'log'" }];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toHaveLength(1);
    expect(report.breakingChanges[0].kind).toBe('field-type-narrowed');
    expect(report.recommendedBump).toBe('major');
  });

  it('treats a full type replacement (e.g. string -> boolean) as breaking', () => {
    const base: ApiField[] = [{ name: 'labels', optional: true, typeText: 'string' }];
    const current: ApiField[] = [{ name: 'labels', optional: true, typeText: 'boolean' }];

    const report = detectBreakingChanges(base, current);

    expect(report.breakingChanges).toHaveLength(1);
    expect(report.breakingChanges[0].kind).toBe('field-type-narrowed');
    expect(report.recommendedBump).toBe('major');
  });

  it('aggregates multiple simultaneous changes and still recommends major if any is breaking', () => {
    const base: ApiField[] = [
      { name: 'user', optional: false, typeText: 'string' },
      { name: 'removedField', optional: true, typeText: 'string' },
    ];
    const current: ApiField[] = [
      { name: 'user', optional: false, typeText: 'string' },
      { name: 'brandNewField', optional: true, typeText: 'boolean' },
    ];

    const report = detectBreakingChanges(base, current);

    expect(report.changes).toHaveLength(2);
    expect(report.breakingChanges).toHaveLength(1);
    expect(report.recommendedBump).toBe('major');
  });
});
