import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { ComponentProps } from 'react';
import type { DeltaFormat, Language, Timezone, ViewMode } from '../types';

vi.mock('./ThemeSelector', () => ({
  StyledSelect: ({
    children,
    id,
    value,
    onChange,
    ariaLabel,
  }: {
    children: React.ReactNode;
    id?: string;
    value?: string;
    onChange?: (value: string) => void;
    ariaLabel?: string;
  }) => (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
}));

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

describe('AdvancedSettingsPanel Theme Contrast', () => {
  it('includes light and dark theme classes on section labels', () => {
    const { container } = render(<AdvancedSettingsPanel {...defaultProps} />);

    const labels = container.querySelectorAll('.text-gray-600.dark\\:text-white\\/60');

    expect(labels.length).toBeGreaterThan(0);
  });

  it('includes light and dark theme classes on visibility controls', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const checkboxLabel = screen.getByText('Hide Title');

    expect(checkboxLabel.className).toContain('text-gray-700');
    expect(checkboxLabel.className).toContain('dark:text-white/70');
  });

  it('includes light and dark theme classes on dimension inputs', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const widthInput = screen.getByLabelText('Width');

    expect(widthInput.className).toContain('bg-white/60');
    expect(widthInput.className).toContain('dark:bg-black/40');
    expect(widthInput.className).toContain('border-black/10');
    expect(widthInput.className).toContain('dark:border-white/10');
  });

  it('includes theme-aware separator styling', () => {
    const { container } = render(<AdvancedSettingsPanel {...defaultProps} />);

    const separator = container.querySelector('.bg-black\\/5.dark\\:bg-white\\/5');

    expect(separator).toBeTruthy();
  });

  it('includes theme-aware styling for grace controls', () => {
    const { container } = render(<AdvancedSettingsPanel {...defaultProps} />);

    const sliderTrack = container.querySelector('.bg-gray-300.dark\\:bg-white\\/6');

    expect(sliderTrack).toBeTruthy();

    const graceValue = screen.getByText(String(defaultProps.grace));

    expect(graceValue.className).toContain('text-emerald-600');
    expect(graceValue.className).toContain('dark:text-emerald-300/60');
  });
});
