import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { DeltaFormat, Language, Timezone, ViewMode } from '../types';

const defaultProps = {
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
} satisfies ComponentProps<typeof AdvancedSettingsPanel>;

describe('AdvancedSettingsPanel timezone control', () => {
  it('renders UTC as the default timezone option', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    expect((screen.getByLabelText('Timezone') as HTMLSelectElement).value).toBe('UTC');
  });

  it('calls onTimezoneChange with the selected IANA timezone', () => {
    const onTimezoneChange = vi.fn();
    render(<AdvancedSettingsPanel {...defaultProps} onTimezoneChange={onTimezoneChange} />);

    fireEvent.change(screen.getByLabelText('Timezone'), {
      target: { value: 'Asia/Kolkata' },
    });

    expect(onTimezoneChange).toHaveBeenCalledWith('Asia/Kolkata');
  });
});
