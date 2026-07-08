import { describe, expect, it, expectTypeOf } from 'vitest';
import type { z } from 'zod';

import { notifyPostSchema, notifyGetSchema, type NotifyPostParams } from '@/lib/validations';

describe('app/api/notify/route.ts - Type Compiler Validation & Schema Constraints Stability', () => {
  it('infers NotifyPostParams from notifyPostSchema', () => {
    expectTypeOf<NotifyPostParams>().toEqualTypeOf<z.infer<typeof notifyPostSchema>>();
  });

  it('accepts a valid notification registration payload', () => {
    const result = notifyPostSchema.safeParse({
      username: 'octocat',
      email: 'octocat@example.com',
      frequency: 'daily',
      preferences: {
        notifyOnCommit: true,
        notifyOnStreak: false,
        notifyOnMilestone: true,
      },
      managementToken: 'cpn_abcdefghijklmnopqrstuvwxyz123456',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.username).toBe('octocat');
      expect(result.data.email).toBe('octocat@example.com');
      expect(result.data.frequency).toBe('daily');
      expect(result.data.managementToken).toMatch(/^cpn_/);
    }
  });

  it('rejects invalid username and email with field errors', () => {
    const result = notifyPostSchema.safeParse({
      username: 'invalid username!',
      email: 'not-an-email',
      frequency: 'daily',
      preferences: {
        notifyOnCommit: true,
        notifyOnStreak: true,
        notifyOnMilestone: true,
      },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.username).toBeDefined();
      expect(errors.email).toBeDefined();
    }
  });

  it('accepts payload without optional managementToken', () => {
    const result = notifyPostSchema.safeParse({
      username: 'octocat',
      email: 'octocat@example.com',
      frequency: 'weekly',
      preferences: {
        notifyOnCommit: true,
        notifyOnStreak: true,
        notifyOnMilestone: false,
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.managementToken).toBeUndefined();

      expectTypeOf(result.data.managementToken).toEqualTypeOf<string | undefined>();
    }
  });

  it('validates notifyGetSchema usernames', () => {
    const valid = notifyGetSchema.safeParse({
      user: 'octocat',
    });

    expect(valid.success).toBe(true);

    const invalid = notifyGetSchema.safeParse({
      user: 'invalid username!',
    });

    expect(invalid.success).toBe(false);

    if (!invalid.success) {
      expect(invalid.error.flatten().fieldErrors.user).toBeDefined();
    }
  });
});
