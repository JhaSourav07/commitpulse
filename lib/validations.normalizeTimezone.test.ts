import { describe, it, expect } from 'vitest';
import { normalizeTimezone } from './validations';
import { streakParamsSchema } from './validations';

describe('normalizeTimezone', () => {
  it('maps GMT+N to Etc/GMT-N (inverted sign convention)', () => {
    expect(normalizeTimezone('GMT+1')).toBe('Etc/GMT-1');
    expect(normalizeTimezone('GMT+5')).toBe('Etc/GMT-5');
    expect(normalizeTimezone('GMT+14')).toBe('Etc/GMT-14');
  });

  it('maps GMT-N to Etc/GMT+N (inverted sign convention)', () => {
    expect(normalizeTimezone('GMT-1')).toBe('Etc/GMT+1');
    expect(normalizeTimezone('GMT-5')).toBe('Etc/GMT+5');
    expect(normalizeTimezone('GMT-12')).toBe('Etc/GMT+12');
  });

  it('maps UTC+N to Etc/GMT-N', () => {
    expect(normalizeTimezone('UTC+3')).toBe('Etc/GMT-3');
    expect(normalizeTimezone('UTC+8')).toBe('Etc/GMT-8');
  });

  it('maps UTC-N to Etc/GMT+N', () => {
    expect(normalizeTimezone('UTC-3')).toBe('Etc/GMT+3');
    expect(normalizeTimezone('UTC-8')).toBe('Etc/GMT+8');
  });

  it('maps GMT+0 and UTC+0 to UTC', () => {
    expect(normalizeTimezone('GMT+0')).toBe('UTC');
    expect(normalizeTimezone('UTC+0')).toBe('UTC');
  });

  it('maps GMT-0 and UTC-0 to UTC', () => {
    expect(normalizeTimezone('GMT-0')).toBe('UTC');
    expect(normalizeTimezone('UTC-0')).toBe('UTC');
  });

  it('is case-insensitive', () => {
    expect(normalizeTimezone('gmt+5')).toBe('Etc/GMT-5');
    expect(normalizeTimezone('utc-3')).toBe('Etc/GMT+3');
    expect(normalizeTimezone('Gmt+1')).toBe('Etc/GMT-1');
    expect(normalizeTimezone('Utc-7')).toBe('Etc/GMT+7');
  });

  it('returns the input unchanged for IANA timezone names', () => {
    expect(normalizeTimezone('America/New_York')).toBe('America/New_York');
    expect(normalizeTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(normalizeTimezone('UTC')).toBe('UTC');
    expect(normalizeTimezone('Etc/GMT+5')).toBe('Etc/GMT+5');
  });

  it('returns the input unchanged for out-of-range offsets', () => {
    // UTC+14 is the max positive offset; +15 is out of range
    expect(normalizeTimezone('GMT+15')).toBe('GMT+15');
    // UTC-12 is the max negative offset; -13 is out of range
    expect(normalizeTimezone('GMT-13')).toBe('GMT-13');
  });

  it('returns the input unchanged for fractional offsets (unsupported)', () => {
    // Fractional offsets like UTC+5:30 don't match the whole-hour regex
    expect(normalizeTimezone('UTC+5:30')).toBe('UTC+5:30');
    expect(normalizeTimezone('GMT+5:45')).toBe('GMT+5:45');
  });

  it('returns the input unchanged for invalid strings', () => {
    expect(normalizeTimezone('Invalid/Zone')).toBe('Invalid/Zone');
    expect(normalizeTimezone('')).toBe('');
    expect(normalizeTimezone('GMT')).toBe('GMT');
    expect(normalizeTimezone('UTC')).toBe('UTC');
  });
});

describe('streakParamsSchema — tz field with raw GMT/UTC offsets', () => {
  const baseParams = { user: 'octocat' };

  it('accepts standard IANA timezone names', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'America/New_York' });
    expect(result.success).toBe(true);
  });

  it('accepts Etc/GMT±N format', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'Etc/GMT+5' });
    expect(result.success).toBe(true);
  });

  it('accepts raw GMT+N offsets', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'GMT+1' });
    expect(result.success).toBe(true);
  });

  it('accepts raw GMT-N offsets', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'GMT-5' });
    expect(result.success).toBe(true);
  });

  it('accepts raw UTC+N offsets', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'UTC+8' });
    expect(result.success).toBe(true);
  });

  it('accepts raw UTC-N offsets', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'UTC-3' });
    expect(result.success).toBe(true);
  });

  it('accepts GMT+0 as valid', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'GMT+0' });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-range offsets', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'GMT+15' });
    expect(result.success).toBe(false);
  });

  it('rejects completely invalid timezone strings', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams, tz: 'Not/A/Timezone' });
    expect(result.success).toBe(false);
  });

  it('accepts undefined tz (optional parameter)', () => {
    const result = streakParamsSchema.safeParse({ ...baseParams });
    expect(result.success).toBe(true);
  });
});
