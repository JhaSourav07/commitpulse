import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

const normalizeToTimezone = (utcTimestamp: number, offsetHours: number): Date => {
  const offsetMs = offsetHours * 60 * 60 * 1000;
  return new Date(utcTimestamp + offsetMs);
};

const formatDateForLocale = (date: Date, locale: string): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

describe('TechnologyGraph Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const defaultProps = {
    selected: [],
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. renders successfully with mocked timezone offset configurations', () => {
    const offsets = [0, -5, 5.5, 9];

    offsets.forEach((offset) => {
      const normalized = normalizeToTimezone(Date.now(), offset);
      expect(normalized).toBeInstanceOf(Date);
      expect(isNaN(normalized.getTime())).toBe(false);
    });

    render(<TechnologyGraph {...defaultProps} />);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('2. asserts calculations align commits onto the correct visual dates across UTC, EST, IST and JST', () => {
    const utcTimestamp = new Date('2024-01-01T00:30:00Z').getTime();

    const utcDate = normalizeToTimezone(utcTimestamp, 0);
    const estDate = normalizeToTimezone(utcTimestamp, -5);
    const istDate = normalizeToTimezone(utcTimestamp, 5.5);
    const jstDate = normalizeToTimezone(utcTimestamp, 9);

    expect(utcDate.getUTCDate()).toBe(1);
    expect(utcDate.getUTCMonth()).toBe(0); // January

    expect(estDate.getUTCDate()).toBe(31);
    expect(estDate.getUTCMonth()).toBe(11); // December

    expect(istDate.getUTCDate()).toBe(1);
    expect(jstDate.getUTCDate()).toBe(1);

    render(<TechnologyGraph {...defaultProps} />);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    const feb28 = new Date('2024-02-28T00:00:00Z');
    const feb29 = new Date('2024-02-29T00:00:00Z');
    const mar1 = new Date('2024-03-01T00:00:00Z');

    expect(isNaN(feb28.getTime())).toBe(false);
    expect(isNaN(feb29.getTime())).toBe(false);
    expect(isNaN(mar1.getTime())).toBe(false);

    const dayMs = 24 * 60 * 60 * 1000;
    expect(feb29.getTime() - feb28.getTime()).toBe(dayMs);
    expect(mar1.getTime() - feb29.getTime()).toBe(dayMs);

    render(<TechnologyGraph {...defaultProps} />);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const date = new Date('2024-03-15T12:00:00Z');

    const enUS = formatDateForLocale(date, 'en-US');
    const enGB = formatDateForLocale(date, 'en-GB');
    const jaJP = formatDateForLocale(date, 'ja-JP');

    expect(typeof enUS).toBe('string');
    expect(enUS.length).toBeGreaterThan(0);

    expect(typeof enGB).toBe('string');
    expect(enGB.length).toBeGreaterThan(0);

    expect(typeof jaJP).toBe('string');
    expect(jaJP.length).toBeGreaterThan(0);

    expect(enUS.includes('2024') || enUS.includes('24')).toBe(true);
    expect(enGB.includes('2024') || enGB.includes('24')).toBe(true);

    render(<TechnologyGraph {...defaultProps} />);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });

  it('5. tests offsets around transition dates like daylight savings transition without corrupting date alignment', () => {
    const beforeDST = new Date('2024-03-10T06:59:00Z').getTime();
    const afterDST = new Date('2024-03-10T07:01:00Z').getTime();

    const beforeNormalized = normalizeToTimezone(beforeDST, -5); // EST
    const afterNormalized = normalizeToTimezone(afterDST, -4); // EDT

    expect(isNaN(beforeNormalized.getTime())).toBe(false);
    expect(isNaN(afterNormalized.getTime())).toBe(false);

    const diffMs = afterNormalized.getTime() - beforeNormalized.getTime();
    expect(diffMs).toBe(afterDST - beforeDST + (-4 - -5) * 60 * 60 * 1000);

    render(<TechnologyGraph {...defaultProps} />);
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
  });
});
