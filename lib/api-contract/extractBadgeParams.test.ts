import { describe, it, expect } from 'vitest';
import { extractInterfaceFields } from './extractBadgeParams';

describe('extractInterfaceFields', () => {
  it('extracts required and optional fields with their type text', () => {
    const source = `
      export interface BadgeParams {
        user: string;
        grace?: number;
        scale: 'linear' | 'log' | 'sqrt';
      }
    `;

    const fields = extractInterfaceFields(source, 'BadgeParams');

    expect(fields).toEqual([
      { name: 'user', optional: false, typeText: 'string' },
      { name: 'grace', optional: true, typeText: 'number' },
      { name: 'scale', optional: false, typeText: "'linear' | 'log' | 'sqrt'" },
    ]);
  });

  it('returns an empty array when the interface does not exist in the source', () => {
    const source = `export interface SomethingElse { foo: string; }`;

    const fields = extractInterfaceFields(source, 'BadgeParams');

    expect(fields).toEqual([]);
  });

  it('ignores interfaces with a different name even if structurally similar', () => {
    const source = `
      export interface BadgeParamsV2 { user: string; }
      export interface BadgeParams { name: string; }
    `;

    const fields = extractInterfaceFields(source, 'BadgeParams');

    expect(fields).toEqual([{ name: 'name', optional: false, typeText: 'string' }]);
  });

  it('handles fields with no explicit type annotation by reporting "unknown"', () => {
    const source = `
      export interface BadgeParams {
        user;
      }
    `;

    const fields = extractInterfaceFields(source, 'BadgeParams');

    expect(fields).toEqual([{ name: 'user', optional: false, typeText: 'unknown' }]);
  });
});
