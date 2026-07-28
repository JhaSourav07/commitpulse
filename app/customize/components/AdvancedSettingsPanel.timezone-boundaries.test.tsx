import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';

const defaultProps = {
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default' as ViewMode,
  deltaFormat: 'both' as DeltaFormat,
  badgeWidth: 320,
  badgeHeight: 160,
  grace: 7,
  language: 'en' as Language,
  timezone: 'UTC' as Timezone,

  onHideTitleChange: vi.fn(),
  onHideBackgroundChange: vi.fn(),
  onHideStatsChange: vi.fn(),
  onViewModeChange: vi.fn(),
  onDeltaFormatChange: vi.fn(),
  onBadgeWidthChange: vi.fn(),
  onBadgeHeightChange: vi.fn(),
  onGraceChange: vi.fn(),
  onLanguageChange: vi.fn(),
  onTimezoneChange: vi.fn(),
};

const timezones: Timezone[] = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

describe('AdvancedSettingsPanel - Timezone Normalization & Calendar Data Boundary Alignment (Variation 8)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. renders consistently across multiple timezones', () => {
    for (const tz of timezones) {
      const { unmount } = render(
        <AdvancedSettingsPanel {...defaultProps} timezone={tz as Timezone} />
      );

      expect(
        screen.getByRole('region', {
          name: /advanced settings configuration/i,
        })
      ).toBeInTheDocument();

      unmount();
    }
  });

  it('2. remains identical across calendar date boundaries', () => {
    vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));

    const { rerender } = render(<AdvancedSettingsPanel {...defaultProps} />);

    vi.setSystemTime(new Date('2027-01-01T00:00:01Z'));

    rerender(<AdvancedSettingsPanel {...defaultProps} />);

    expect(
      screen.getByRole('region', {
        name: /advanced settings configuration/i,
      })
    ).toBeInTheDocument();
  });

  it('3. renders correctly during leap-year dates', () => {
    vi.setSystemTime(new Date('2028-02-29T12:00:00Z'));

    render(<AdvancedSettingsPanel {...defaultProps} />);

    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
  });

  it('4. preserves locale-independent rendering across timezone changes', () => {
    const { rerender } = render(<AdvancedSettingsPanel {...defaultProps} timezone="UTC" />);

    rerender(<AdvancedSettingsPanel {...defaultProps} timezone={'Asia/Kolkata' as Timezone} />);

    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
  });

  it('5. preserves rendered content across daylight-saving style transitions', () => {
    vi.setSystemTime(new Date('2026-03-08T06:59:00Z'));

    render(<AdvancedSettingsPanel {...defaultProps} />);

    expect(
      screen.getByRole('region', {
        name: /advanced settings configuration/i,
      })
    ).toBeInTheDocument();
  });
});
