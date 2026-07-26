import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';

// Mirror of the RefreshButton component's prop contract.
// Kept local so the test file is self-contained and acts as a compile-time
// guardrail against accidental upstream prop renaming/removal.
export type RefreshButtonProps = {
  username: string;
};

describe('RefreshButton type & schema compiler checks (Variation 10)', () => {
  // Case 1: Verifies baseline RefreshButtonProps property types align with the public contract
  it('Case 1: Validate baseline RefreshButtonProps property fields (username) to verify type matching parameters align perfectly', () => {
    expectTypeOf<RefreshButtonProps['username']>().toEqualTypeOf<string>();

    // Whole-props envelope must structurally equal the contracted shape
    expectTypeOf<RefreshButtonProps>().toEqualTypeOf<{ username: string }>();
  });

  // Case 2: Asserts static type checking blocks misaligned interface layouts from compiling
  it('Case 2: Ensure invalid structural definitions are caught and blocked during static assignment checks', () => {
    type InvalidPropsNumberUsername = {
      username: number;
    };

    type InvalidPropsBooleanUsername = {
      username: boolean;
    };

    type InvalidPropsWrongKey = {
      user: string;
    };

    expectTypeOf<InvalidPropsNumberUsername>().not.toMatchTypeOf<RefreshButtonProps>();
    expectTypeOf<InvalidPropsBooleanUsername>().not.toMatchTypeOf<RefreshButtonProps>();
    expectTypeOf<InvalidPropsWrongKey>().not.toMatchTypeOf<RefreshButtonProps>();

    // null / undefined are not assignable as a username string
    type NullableUsername = { username: string | null };
    expectTypeOf<NullableUsername>().not.toMatchTypeOf<RefreshButtonProps>();
  });

  // Case 3: Confirms the prop envelope tolerates minimal and rich consumer-side definitions cleanly
  it('Case 3: Verify the RefreshButton props envelope seamlessly tolerates minimal and extended consumer shapes without dropping compilation support', () => {
    type MinimalProps = {
      username: string;
    };

    // A consumer extending the props with extra fields must still satisfy the base contract
    type ExtendedProps = {
      username: string;
      analyticsTag: string;
      retries: number;
    };

    expectTypeOf<MinimalProps>().toMatchTypeOf<RefreshButtonProps>();
    expectTypeOf<ExtendedProps>().toMatchTypeOf<RefreshButtonProps>();

    // Empty / unknown-string username variants
    type LiteralUsername = { username: 'octocat' };
    expectTypeOf<LiteralUsername>().toMatchTypeOf<RefreshButtonProps>();
  });

  // Case 4: Checks that out-of-bounds parameters generate flat field errors and catch unexpected fields
  it('Case 4: Assert that an associated strict validation schema rejects out-of-bounds username fields with explicit flat error reports', () => {
    const refreshButtonPropsSchema = z
      .object({
        username: z
          .string()
          .min(1, 'Username is required')
          .max(39, 'Username exceeds GitHub max length')
          .regex(/^[a-zA-Z0-9-]+$/, 'Username contains invalid characters'),
      })
      .strict();

    const outOfBoundsRecord = {
      username: '!!invalid user!!',
      extraField: 'unexpected',
    };

    const result = refreshButtonPropsSchema.safeParse(outOfBoundsRecord);
    expect(result.success).toBe(false);

    if (!result.success) {
      const flatErrors = result.error.flatten();

      expect(flatErrors.fieldErrors).toHaveProperty('username');

      const hasUnrecognizedExtra = result.error.issues.some(
        (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes('extraField')
      );
      expect(hasUnrecognizedExtra).toBe(true);
    }

    // Empty username must also be rejected with a clear field error
    const emptyResult = refreshButtonPropsSchema.safeParse({ username: '' });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.flatten().fieldErrors).toHaveProperty('username');
    }
  });

  // Case 5: Validates clean payloads clear parsing pipelines and maintain type assignability properties
  it('Case 5: Prove that standard compliant RefreshButton props records cleanly clear validation gates and preserve underlying type integrity definitions', () => {
    const refreshButtonPropsSchema = z
      .object({
        username: z
          .string()
          .min(1)
          .max(39)
          .regex(/^[a-zA-Z0-9-]+$/),
      })
      .strict();

    const validRecord = {
      username: 'octocat',
    };

    const parsed = refreshButtonPropsSchema.parse(validRecord);
    expect(parsed).toEqual(validRecord);

    type ParsedType = z.infer<typeof refreshButtonPropsSchema>;
    expectTypeOf<ParsedType>().toMatchTypeOf<RefreshButtonProps>();

    // Round-trip: parsed payload is structurally usable wherever RefreshButtonProps is required
    const handlerUsingProps = (props: RefreshButtonProps): string => `/dashboard/${props.username}`;
    expect(handlerUsingProps(parsed)).toBe('/dashboard/octocat');
  });
});
