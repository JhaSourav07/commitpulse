import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';

const defaultProps = {
  hideTitle: false,
  hideBackground: false,
  hideStats: false,

  viewMode: 'default' as ViewMode,
  deltaFormat: 'short' as DeltaFormat,

  badgeWidth: '' as number | '',
  badgeHeight: '' as number | '',

  grace: 3,

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

describe('AdvancedSettingsPanel Responsive Breakpoints', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });

    window.dispatchEvent(new Event('resize'));
  });

  function setViewport(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });

    window.dispatchEvent(new Event('resize'));
  }

  it('renders correctly on a mobile viewport (375px)', () => {
    setViewport(375);

    render(<AdvancedSettingsPanel {...defaultProps} />);

    expect(
      screen.getByRole('region', {
        name: /advanced settings configuration/i,
      })
    ).toBeInTheDocument();
  });

  it('keeps the width/height controls inside the responsive grid', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const widthInput = screen.getByLabelText(/width/i);
    const grid = widthInput.closest('div')?.parentElement;

    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('gap-4');
  });

  it('does not use fixed pixel widths that could overflow on mobile', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const inputs = screen.getAllByRole('spinbutton');

    inputs.forEach((input) => {
      expect(input.className).toContain('w-full');
      expect(input.className).toContain('min-w-0');
    });
  });

  it('allows mobile interaction with visibility toggles', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/hide title/i));

    expect(defaultProps.onHideTitleChange).toHaveBeenCalledWith(true);
  });

  it('allows changing the grace slider on small screens', () => {
    setViewport(375);

    render(<AdvancedSettingsPanel {...defaultProps} />);

    const slider = screen.getByRole('slider');

    fireEvent.change(slider, {
      target: { value: '6' },
    });

    expect(defaultProps.onGraceChange).toHaveBeenCalledWith(6);
  });
});
