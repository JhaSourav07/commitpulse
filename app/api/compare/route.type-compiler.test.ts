import { describe, it, expectTypeOf } from 'vitest';
import type { CompareParams } from '@/lib/validations';

describe('Compare API Type Compiler Validation', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Type shape validation
  // ─────────────────────────────────────────────────────────────
  it('has correct structure for CompareParams', () => {
    expectTypeOf<CompareParams>().toEqualTypeOf<{
      user1: string;
      user2: string;
    }>();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Valid assignment check
  // ─────────────────────────────────────────────────────────────
  it('accepts valid compare params object', () => {
    const valid: CompareParams = {
      user1: 'octocat',
      user2: 'torvalds',
    };

    expectTypeOf(valid).toMatchTypeOf<CompareParams>();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Field-level type safety
  // ─────────────────────────────────────────────────────────────
  it('ensures fields are strictly string typed', () => {
    expectTypeOf<CompareParams['user1']>().toBeString();
    expectTypeOf<CompareParams['user2']>().toBeString();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Key stability check
  // ─────────────────────────────────────────────────────────────
  it('ensures only expected keys exist', () => {
    type Keys = keyof CompareParams;
    expectTypeOf<Keys>().toEqualTypeOf<'user1' | 'user2'>();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Negative compile-time constraint (safe version)
  // ─────────────────────────────────────────────────────────────
  it('rejects invalid structure via type mismatch', () => {
    type Invalid = {
      user1: number;
      user2: string;
    };

    // This ensures CompareParams is NOT compatible with invalid shape
    expectTypeOf<Invalid>().not.toMatchTypeOf<CompareParams>();
  });
});
