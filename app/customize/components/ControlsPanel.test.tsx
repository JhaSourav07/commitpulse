import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ControlsPanel } from './ControlsPanel';
import type { BadgeSize, DeltaFormat, Font, Language, Scale, Timezone, ViewMode } from '../types';

const defaultProps = {
  username: 'octocat',
  theme: 'dark',
  bgHex: '',
  accentHex: '',
  textHex: '',
  scale: 'linear' as Scale,
  speed: '8s',
  font: '' as Font,
  year: '',
  radius: 8,
  size: 'medium' as BadgeSize,
  onUsernameChange: vi.fn(),
  onThemeChange: vi.fn(),
  onBgHexChange: vi.fn(),
  onAccentHexChange: vi.fn(),
  onTextHexChange: vi.fn(),
  onScaleChange: vi.fn(),
  onSpeedChange: vi.fn(),
  onFontChange: vi.fn(),
  onYearChange: vi.fn(),
  onSizeChange: vi.fn(),
  onClearOverrides: vi.fn(),
  onRadiusChange: vi.fn(),
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default' as ViewMode,
  deltaFormat: 'percent' as DeltaFormat,
  badgeWidth: '' as const,
  badgeHeight: '' as const,
  grace: 1,
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
} satisfies ComponentProps<typeof ControlsPanel>;

describe('ControlsPanel timezone control', () => {
  it('renders UTC as the default timezone option', () => {
    render(<ControlsPanel {...defaultProps} />);

    expect((screen.getByLabelText('Timezone') as HTMLSelectElement).value).toBe('UTC');
  });

  it('calls onTimezoneChange with the selected IANA timezone', () => {
    const onTimezoneChange = vi.fn();
    render(<ControlsPanel {...defaultProps} onTimezoneChange={onTimezoneChange} />);

    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'Asia/Kolkata' },
    });

    expect(onTimezoneChange).toHaveBeenCalledWith('Asia/Kolkata');
  });
});
