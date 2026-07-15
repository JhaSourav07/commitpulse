import '@testing-library/jest-dom';
import type { Scale, BadgeSize, Font } from '../types';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ControlsPanel } from './ControlsPanel';

const defaultProps = {
  username: 'octocat',
  theme: 'dark',
  bgHex: '',
  bgType: 'solid' as 'solid' | 'linear' | 'radial',
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '',
  textHex: '',
  scale: 'linear' as Scale,
  speed: '8s',
  font: 'inter' as Font,
  year: '',
  radius: 8,
  size: 'md' as BadgeSize,

  onUsernameChange: vi.fn(),
  onThemeChange: vi.fn(),
  onBgHexChange: vi.fn(),
  onBgTypeChange: vi.fn(),
  onBgStartChange: vi.fn(),
  onBgEndChange: vi.fn(),
  onBgAngleChange: vi.fn(),
  onAccentHexChange: vi.fn(),
  onTextHexChange: vi.fn(),
  onScaleChange: vi.fn(),
  onSpeedChange: vi.fn(),
  onFontChange: vi.fn(),
  onYearChange: vi.fn(),
  onSizeChange: vi.fn(),
  onClearOverrides: vi.fn(),
  onRadiusChange: vi.fn(),
};

function setClock(isoInstant: string, tz: string) {
  process.env.TZ = tz;
  vi.setSystemTime(new Date(isoInstant));
}

function getYearOptionTexts() {
  const yearSelect = document.getElementById('year-select') as HTMLSelectElement;
  return within(yearSelect)
    .getAllByRole('option')
    .map((el) => el.textContent);
}

const originalTZ = process.env.TZ;

describe('ControlsPanel year-sync dropdown: timezone & date boundary behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  it.each([
    ['2026-01-01T00:30:00Z', 'America/Los_Angeles', 2025],
    ['2025-12-31T23:30:00Z', 'Asia/Tokyo', 2026],
  ])(
    'labels the "(current)" option using the viewer\'s local year, not UTC (%s in %s -> %i)',
    (instant, tz, expectedLocalYear) => {
      setClock(instant, tz);

      render(<ControlsPanel {...defaultProps} />);

      expect(screen.getByText(`${expectedLocalYear} (current)`)).toBeTruthy();
      expect(screen.queryByText(`${expectedLocalYear - 1} (current)`)).toBeNull();
      expect(screen.queryByText(`${expectedLocalYear + 1} (current)`)).toBeNull();
    }
  );

  it('generates the year option range down to 2019 with no gaps or duplicates, anchored to the local year', () => {
    setClock('2026-07-10T12:00:00Z', 'Asia/Kolkata');

    render(<ControlsPanel {...defaultProps} />);

    const options = getYearOptionTexts();

    expect(options[0]).toBe('2026 (current)');
    const explicitYears = options.slice(1);
    expect(explicitYears).toEqual(['2025', '2024', '2023', '2022', '2021', '2020', '2019']);

    const numericYears = explicitYears.map(Number);
    for (let i = 1; i < numericYears.length; i++) {
      expect(numericYears[i - 1] - numericYears[i]).toBe(1);
    }
  });

  it('does not drop or duplicate a year option across a Feb 29 leap-year boundary', () => {
    setClock('2028-02-29T23:00:00Z', 'UTC');
    const { unmount } = render(<ControlsPanel {...defaultProps} />);
    const utcYears = getYearOptionTexts();
    unmount();

    setClock('2028-02-29T23:00:00Z', 'Pacific/Auckland');
    render(<ControlsPanel {...defaultProps} />);
    const nzYears = getYearOptionTexts();

    expect(utcYears).toEqual(nzYears);
    expect(utcYears[0]).toBe('2028 (current)');
  });

  it('calls onYearChange with the raw year string for an explicit selection, and "" for "(current)"', () => {
    setClock('2026-03-15T12:00:00Z', 'America/New_York');

    render(<ControlsPanel {...defaultProps} year="2023" />);

    const yearSelect = document.getElementById('year-select');

    fireEvent.change(yearSelect!, { target: { value: '2022' } });
    expect(defaultProps.onYearChange).toHaveBeenCalledWith('2022');

    fireEvent.change(yearSelect!, { target: { value: '' } });
    expect(defaultProps.onYearChange).toHaveBeenCalledWith('');
  });
});
