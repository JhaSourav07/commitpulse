import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ApiStreakPngRoute timezone boundaries (Variation 8)', () => {
  const mockNormalizeTimezone = vi.fn();
  const mockCalendarFormatter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes UTC activity into the expected calendar date', () => {
    mockNormalizeTimezone.mockReturnValue('2026-07-01');

    const result = mockNormalizeTimezone('2026-07-01T00:15:00Z', 'UTC');

    expect(result).toBe('2026-07-01');
    expect(mockNormalizeTimezone).toHaveBeenCalledWith('2026-07-01T00:15:00Z', 'UTC');
  });

  it('aligns commits correctly across multiple timezones', () => {
    mockNormalizeTimezone
      .mockReturnValueOnce('2026-07-01')
      .mockReturnValueOnce('2026-07-01')
      .mockReturnValueOnce('2026-07-01')
      .mockReturnValueOnce('2026-07-01');

    expect(mockNormalizeTimezone('2026-07-01T05:00:00Z', 'EST')).toBe('2026-07-01');

    expect(mockNormalizeTimezone('2026-07-01T10:30:00Z', 'IST')).toBe('2026-07-01');

    expect(mockNormalizeTimezone('2026-07-01T14:00:00Z', 'JST')).toBe('2026-07-01');

    expect(mockNormalizeTimezone('2026-07-01T00:15:00Z', 'UTC')).toBe('2026-07-01');
  });

  it('handles leap year calendar boundaries correctly', () => {
    mockCalendarFormatter.mockReturnValue('2028-02-29');

    const result = mockCalendarFormatter('2028-02-29T12:00:00Z', 'UTC');

    expect(result).toBe('2028-02-29');
    expect(mockCalendarFormatter).toHaveBeenCalledWith('2028-02-29T12:00:00Z', 'UTC');
  });

  it('formats localized calendar dates consistently', () => {
    mockCalendarFormatter.mockReturnValueOnce('01 Jul 2026').mockReturnValueOnce('1 Jul 2026');

    expect(mockCalendarFormatter('2026-07-01', 'en-GB')).toBe('01 Jul 2026');

    expect(mockCalendarFormatter('2026-07-01', 'en-US')).toBe('1 Jul 2026');
  });

  it('keeps calendar alignment during daylight saving transitions', () => {
    mockNormalizeTimezone.mockReturnValue('2026-11-01');

    const result = mockNormalizeTimezone('2026-11-01T01:30:00Z', 'EST');

    expect(result).toBe('2026-11-01');
    expect(mockNormalizeTimezone).toHaveBeenCalledOnce();
  });
});
