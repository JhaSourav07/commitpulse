import { describe, it, expect } from 'vitest';
import { statsParamsSchema } from './validations';

describe('statsParamsSchema', () => {
  // ── Valid inputs ──────────────────────────────────────────────────────────

  it('parses a minimal valid input with only user', () => {
    const result = statsParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.refresh).toBe(false);
      expect(result.data.tz).toBeUndefined();
    }
  });

  it('parses a full valid input with optional params', () => {
    const result = statsParamsSchema.safeParse({
      user: 'octocat',
      refresh: 'true',
      tz: 'Asia/Kolkata',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.refresh).toBe(true);
      expect(result.data.tz).toBe('Asia/Kolkata');
    }
  });

  it('transforms refresh parameter correctly', () => {
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'true' }).data?.refresh).toBe(
      true
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'false' }).data?.refresh).toBe(
      false
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: '1' }).data?.refresh).toBe(
      false
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'TRUE' }).data?.refresh).toBe(
      false
    );
  });

  // ── Invalid inputs ────────────────────────────────────────────────────────

  it('fails when user is missing', () => {
    const result = statsParamsSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.user).toBeDefined();
      expect(fieldErrors.user?.[0]).toContain('Missing user parameter');
    }
  });

  it('fails when user is an empty string', () => {
    const result = statsParamsSchema.safeParse({ user: '' });
    expect(result.success).toBe(false);
  });

  it('fails when username exceeds 39 characters', () => {
    const result = statsParamsSchema.safeParse({ user: 'a'.repeat(40) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.user?.[0]).toContain('cannot exceed 39 characters');
    }
  });

  it('fails when username has invalid format', () => {
    const result = statsParamsSchema.safeParse({ user: 'invalid user!' });
    expect(result.success).toBe(false);
  });

  it('fails when IANA timezone is invalid', () => {
    const result = statsParamsSchema.safeParse({
      user: 'octocat',
      tz: 'Not/ATimezone',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.tz).toBeDefined();
      expect(fieldErrors.tz?.[0]).toContain('Invalid timezone');
    }
  });
});
