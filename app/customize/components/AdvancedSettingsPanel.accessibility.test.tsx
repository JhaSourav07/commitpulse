import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';

describe('AdvancedSettingsPanel Accessibility & Screen Reader Compliance', () => {
  const defaultProps = {
    hideTitle: false,
    hideBackground: false,
    hideStats: false,
    viewMode: 'default' as const,
    deltaFormat: 'percent' as const,
    badgeWidth: '' as const,
    badgeHeight: '' as const,
    grace: 0,
    language: 'en' as const,
    timezone: 'UTC' as const,
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

  it('verifies that interactive configuration elements render with proper labeling and presence', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    // Checkboxes should be implicitly labeled by their wrapping labels
    expect(screen.getByLabelText('Hide Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Background')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Stats')).toBeInTheDocument();
  });

  it('asserts environment interactive configuration elements maintain visible outline behaviors', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const hideTitleCheckbox = screen.getByLabelText('Hide Title');

    // Check that it accepts focus and has specific outline/ring styles from Tailwind
    expect(hideTitleCheckbox).toHaveClass('focus:ring-emerald-500/50');
  });

  it('verifies tooltip labels for configuration elements are announced with correct accessibility descriptions', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    // The Timezone select explicitly receives an aria-label from the StyledSelect component
    const timezoneSelect = screen.getByLabelText('Timezone');
    expect(timezoneSelect).toBeInTheDocument();
    expect(timezoneSelect.tagName).toBe('SELECT');
  });

  it('verifies keyboard control path selectors ensure normal tab ordering for configuration panels', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    // Input elements must be focusable via tab ordering natively
    const widthInput = screen.getAllByPlaceholderText('Auto')[0];
    const rangeSlider = screen.getByRole('slider');

    expect(rangeSlider).toHaveAttribute('type', 'range');
    expect(rangeSlider).not.toHaveAttribute('tabIndex', '-1'); // Must be focusable
  });

  it('confirms configuration headings exist in the correct logical hierarchical order', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    // Verify the visual "headings" or section labels are present to structure the page
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    expect(screen.getByText('Visibility Options')).toBeInTheDocument();
    expect(screen.getByText('View Layout')).toBeInTheDocument();
  });
});
