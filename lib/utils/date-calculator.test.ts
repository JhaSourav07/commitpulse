import { describe, it, expect } from 'vitest';
import { formatLocalDate, CalendarSystem } from './date-calculator';

describe('formatLocalDate', () => {
  const testDate = new Date('2026-05-28T14:30:15Z'); // UTC time

  it('formats with default arguments (locale = en, date-only, UTC)', () => {
    const formatted = formatLocalDate(testDate);
    // e.g. "May 28, 2026"
    expect(formatted).toContain('May');
    expect(formatted).toContain('28');
    expect(formatted).toContain('2026');
  });

  it('respects different format types', () => {
    // 1. Date Only
    const dateOnly = formatLocalDate(testDate, 'en-US', { formatType: 'date-only' });
    expect(dateOnly).toContain('May');
    expect(dateOnly).not.toContain('2:30');

    // 2. Time Only
    const timeOnly = formatLocalDate(testDate, 'en-US', { formatType: 'time-only', hour12: true });
    // "2:30:15 PM"
    expect(timeOnly).toContain('2:30');
    expect(timeOnly).toContain('PM');
    expect(timeOnly).not.toContain('May');

    // 3. Full format
    const full = formatLocalDate(testDate, 'en-US', { formatType: 'full', hour12: true });
    expect(full).toContain('May');
    expect(full).toContain('2:30');
    expect(full).toContain('PM');
  });

  it('respects 12-hour vs 24-hour formatting preferences', () => {
    const time12 = formatLocalDate(testDate, 'en-US', {
      formatType: 'time-only',
      hour12: true,
    });
    expect(time12).toContain('PM');
    expect(time12).toContain('2:30');

    const time24 = formatLocalDate(testDate, 'en-US', {
      formatType: 'time-only',
      hour12: false,
    });
    expect(time24).not.toContain('PM');
    expect(time24).toContain('14:30');
  });

  it('handles different timezones correctly', () => {
    // 14:30 UTC is 10:30 EDT (America/New_York)
    const formattedNY = formatLocalDate(testDate, 'en-US', {
      formatType: 'time-only',
      timezone: 'America/New_York',
      hour12: true,
    });
    expect(formattedNY).toContain('10:30');
    expect(formattedNY).toContain('AM');

    // 14:30 UTC is 20:00 IST (Asia/Kolkata, +5:30)
    const formattedKolkata = formatLocalDate(testDate, 'en-US', {
      formatType: 'time-only',
      timezone: 'Asia/Kolkata',
      hour12: false,
    });
    expect(formattedKolkata).toContain('20:00');
  });

  it('supports custom calendar systems via options and unicode extensions', () => {
    // Test Buddhist calendar with Thai locale
    const BuddhistDate = formatLocalDate(testDate, 'th-TH', {
      calendar: 'buddhist',
      formatType: 'date-only',
    });
    // Buddhist calendar year for 2026 is 2026 + 543 = 2569
    expect(BuddhistDate).toContain('2569');

    // Test Persian calendar with Iran locale
    const PersianDate = formatLocalDate(testDate, 'fa-IR', {
      calendar: 'persian',
      formatType: 'date-only',
    });
    // Khordad 1405 (approximate Persian year for May 2026)
    // Persian digits are used in fa-IR locale, e.g. ۱۴۰۵
    expect(PersianDate).toBeDefined();
    expect(PersianDate.length).toBeGreaterThan(0);
  });

  it('verifies multiple diverse locales format differently and gracefully', () => {
    const usFormat = formatLocalDate(testDate, 'en-US'); // "May 28, 2026"
    const gbFormat = formatLocalDate(testDate, 'en-GB'); // "28 May 2026"
    const frFormat = formatLocalDate(testDate, 'fr-FR'); // "28 mai 2026"

    expect(usFormat).not.toBe(gbFormat);
    expect(gbFormat).not.toBe(frFormat);
    expect(frFormat).toContain('mai');
  });
});
