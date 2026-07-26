import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';

// Type definitions used by the contributors page
type ExpectedContributor = {
  id: number;
  username: string;
  avatarUrl: string;
  contributions: number;
};

type PageProps = {
  contributors: ExpectedContributor[];
  showAvatars?: boolean;
  topN?: number;
};

describe('ContributorsPage type & schema compiler checks (Variation 10)', () => {
  it('Case 1: Validate core property shapes match design boundaries', () => {
    type Matching = {
      id: number;
      username: string;
      avatarUrl: string;
      contributions: number;
    };

    expectTypeOf<Matching>().toEqualTypeOf<ExpectedContributor>();
  });

  it('Case 2: Ensure invalid parameters are blocked via static assignability', () => {
    type Invalid = {
      id: string; // wrong type
      username: number; // wrong type
      contributions?: string; // wrong and optional
    };

    expectTypeOf<Invalid>().not.toMatchTypeOf<ExpectedContributor>();
  });

  it('Case 3: Optional fields accepted safely without compile-time warnings', () => {
    const minimal: PageProps = {
      contributors: [{ id: 1, username: 'bob', avatarUrl: '/img/bob.png', contributions: 3 }],
    };

    expect(minimal.contributors.length).toBe(1);
    type MinimalType = typeof minimal;
    expectTypeOf<MinimalType>().toMatchTypeOf<PageProps>();
  });

  it('Case 4: Zod runtime schema flags out-of-bound structural types with flat reports', () => {
    const contributorSchema = z
      .object({
        id: z.number().int().positive(),
        username: z.string().min(1),
        avatarUrl: z.string().min(1),
        contributions: z.number().int().nonnegative(),
      })
      .strict();

    const bad = {
      id: -5,
      username: '',
      avatarUrl: 12345,
      contributions: -1,
      extra: 'unexpected',
    } as unknown;

    try {
      contributorSchema.parse(bad);
      expect(false).toBe(true);
    } catch (err) {
      const zErr = err as z.ZodError;
      expect(zErr.issues.length).toBeGreaterThan(0);
      // flat validation: all issue paths are shallow (no deep nesting)
      const allShallow = zErr.issues.every((i) => i.path.length <= 1);
      expect(allShallow).toBe(true);
    }
  });

  it('Case 5: Correct payloads safely clear validation limits', () => {
    const contributorSchema = z.object({
      id: z.number().int().positive(),
      username: z.string().min(1),
      avatarUrl: z.string().min(1),
      contributions: z.number().int().nonnegative(),
    });

    const good = {
      id: 2,
      username: 'alice',
      avatarUrl: 'https://cdn.test/a.png',
      contributions: 10,
    };

    const parsed = contributorSchema.parse(good);
    expect(parsed).toEqual(good);
    type ParsedType = z.infer<typeof contributorSchema>;
    expectTypeOf<ParsedType>().toEqualTypeOf<ExpectedContributor>();
  });
});
