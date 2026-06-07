import { describe, it, expect } from 'vitest';
import { streakParamsSchema } from './validations';

describe('streakParamsSchema', () => {
  // ── Valid inputs ──────────────────────────────────────────────────────────

  it('parses a minimal valid input with only user', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      // Defaults must be applied
      expect(result.data.theme).toBe('dark');
      expect(result.data.size).toBe('medium');
      expect(result.data.scale).toBe('linear');
      expect(result.data.grace).toBe(1);
    }
  });

  it('parses a full valid input with common optional params', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      theme: 'neon',
      size: 'large',
      scale: 'log',
      grace: '2',
      hide_title: 'true',
      hide_stats: '1',
      lang: 'hi',
      tz: 'Asia/Kolkata',
      view: 'monthly',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe('large');
      expect(result.data.scale).toBe('log');
      expect(result.data.grace).toBe(2);
      expect(result.data.hide_title).toBe(true);
      expect(result.data.hide_stats).toBe(true);
      expect(result.data.lang).toBe('hi');
      expect(result.data.tz).toBe('Asia/Kolkata');
      expect(result.data.view).toBe('monthly');
    }
  });

  it('accepts a valid hex bg color without #', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', bg: '0d1117' });
    expect(result.success).toBe(true);
  });

  it('accepts a comma-separated accent list', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', accent: 'ff0000,00ff00' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.accent)).toBe(true);
    }
  });

  it('accepts valid from/to date range', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      from: '2024-01-01',
      to: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  // ── Invalid / negative cases ──────────────────────────────────────────────

  it('fails when user is missing', () => {
    const result = streakParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('fails when user is an empty string', () => {
    const result = streakParamsSchema.safeParse({ user: '' });
    expect(result.success).toBe(false);
  });

  it('fails when username exceeds 39 characters', () => {
    const result = streakParamsSchema.safeParse({ user: 'a'.repeat(40) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('39'))).toBe(true);
    }
  });

  it('fails when username contains invalid characters', () => {
    const result = streakParamsSchema.safeParse({ user: 'invalid user!' });
    expect(result.success).toBe(false);
  });

  it('fails for invalid bg hex color', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', bg: 'zzzzzz' });
    expect(result.success).toBe(false);
  });

  it('fails when grace is out of range (> 7)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '8' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('grace'))).toBe(true);
    }
  });

  it('fails when grace is negative', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', grace: '-1' });
    expect(result.success).toBe(false);
  });

  it('fails when "to" date is before "from" date', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      from: '2024-12-31',
      to: '2024-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('"to" date must be after'))).toBe(true);
    }
  });

  it('fails for an invalid year (before 2008)', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', year: '2007' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('2008'))).toBe(true);
    }
  });

  it('fails for an invalid timezone string', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', tz: 'Not/ATimezone' });
    expect(result.success).toBe(false);
  });

  // ── Default / fallback behaviour ──────────────────────────────────────────

  it('falls back to "medium" for an unknown size value', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', size: 'gigantic' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe('medium');
    }
  });

  it('falls back to "linear" for an unknown scale value', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', scale: 'cubic' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scale).toBe('linear');
    }
  });

  it('defaults grace to 1 when omitted', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grace).toBe(1);
    }
  });

  it('defaults opacity to 1.0 when omitted', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.opacity).toBe(1.0);
    }
  });

  it('transforms refresh "true" string to boolean true', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', refresh: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refresh).toBe(true);
    }
  });

  it('transforms hide_background "1" string to boolean true', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', hide_background: '1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hide_background).toBe(true);
    }
  });

  it('accepts a valid versus username', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', versus: 'torvalds' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.versus).toBe('torvalds');
    }
  });

  it('rejects a versus username longer than 39 characters', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', versus: 'a'.repeat(40) });
    expect(result.success).toBe(false);
  });

  it('rejects a versus username with invalid characters', () => {
    const result = streakParamsSchema.safeParse({ user: 'octocat', versus: 'bad user!' });
    expect(result.success).toBe(false);
  });
});
