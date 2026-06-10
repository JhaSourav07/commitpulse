import { describe, expectTypeOf, it } from 'vitest';
import { TrackUserProtection } from './track-user-protection';

type VerifyResult = Awaited<ReturnType<TrackUserProtection['verifyAndDeduplicate']>>;
type ValidReason = NonNullable<VerifyResult['reason']>;

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('enforces correct return type shape for verifyAndDeduplicate', () => {
    expectTypeOf<VerifyResult>().toHaveProperty('allowed').toBeBoolean();
    expectTypeOf<VerifyResult>().toHaveProperty('reason').toEqualTypeOf<ValidReason | undefined>();
    expectTypeOf<VerifyResult>().toHaveProperty('remainingMs').toEqualTypeOf<number | undefined>();
  });

  it('validates method signatures accept correct parameter types and return types', () => {
    type Instance = TrackUserProtection;
    expectTypeOf<Instance['validateFormat']>().parameters.toEqualTypeOf<[username: string]>();
    expectTypeOf<Instance['validateFormat']>().returns.toBeBoolean();
    expectTypeOf<Instance['isWriteAllowed']>().parameters.toEqualTypeOf<[username: string]>();
    expectTypeOf<Instance['isWriteAllowed']>().returns.toBeBoolean();
    expectTypeOf<Instance['recordWrite']>().returns.toBeVoid();
  });

  it('validates singleton instance pattern returns correct type', () => {
    expectTypeOf<
      ReturnType<(typeof TrackUserProtection)['getInstance']>
    >().toEqualTypeOf<TrackUserProtection>();
  });

  it('blocks invalid string literals from being assigned to reason field', () => {
    expectTypeOf<'INVALID'>().not.toMatchTypeOf<ValidReason>();
    expectTypeOf<'INVALID_FORMAT'>().toMatchTypeOf<ValidReason>();
    expectTypeOf<'COOLDOWN_ACTIVE'>().toMatchTypeOf<ValidReason>();
    expectTypeOf<'USER_NOT_FOUND'>().toMatchTypeOf<ValidReason>();
  });

  it('verifies schema validation constraints return strict validation reports', () => {
    expectTypeOf<TrackUserProtection['verifyAndDeduplicate']>().parameters.toEqualTypeOf<
      [username: string]
    >();
    expectTypeOf<TrackUserProtection['verifyAndDeduplicate']>().returns.toEqualTypeOf<
      Promise<VerifyResult>
    >();
  });
});
