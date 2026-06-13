import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import React from 'react';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';

const defaultProps = {
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default' as ViewMode,
  deltaFormat: 'percent' as DeltaFormat,
  badgeWidth: '' as const,
  badgeHeight: '' as const,
  grace: 2,
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

describe('AdvancedSettingsPanel Accessibility Tests', () => {
  // Test 1: Landmark and Section Landmark Roles
  it('1. verifies that the root container has a region role with a descriptive accessibility label', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const region = screen.getByRole('region', { name: /advanced settings configuration/i });
    expect(region).toBeInTheDocument();

    const titleText = screen.getByText('Advanced Settings');
    expect(titleText).toBeInTheDocument();
  });

  // Test 2: Programmatic Label-to-Control Pairings via htmlFor
  it('2. verifies that all form controls (selects, inputs, and sliders) are paired programmatically with semantic label elements', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    // View Layout selector and label
    const viewSelect = screen.getByLabelText(/^view layout$/i);
    expect(viewSelect).toBeInTheDocument();
    expect(viewSelect).toHaveAttribute('id', 'view-select');

    // Delta Format selector and label
    const deltaSelect = screen.getByLabelText(/^delta format$/i);
    expect(deltaSelect).toBeInTheDocument();
    expect(deltaSelect).toHaveAttribute('id', 'delta-select');

    // Width input and label
    const widthInput = screen.getByLabelText(/^width$/i);
    expect(widthInput).toBeInTheDocument();
    expect(widthInput).toHaveAttribute('id', 'width-input');

    // Height input and label
    const heightInput = screen.getByLabelText(/^height$/i);
    expect(heightInput).toBeInTheDocument();
    expect(heightInput).toHaveAttribute('id', 'height-input');

    // Grace Days range slider and label
    const graceSlider = screen.getByLabelText(/^grace days$/i);
    expect(graceSlider).toBeInTheDocument();
    expect(graceSlider).toHaveAttribute('id', 'grace-input');

    // Language selector and label
    const langSelect = screen.getByLabelText(/^language$/i);
    expect(langSelect).toBeInTheDocument();
    expect(langSelect).toHaveAttribute('id', 'lang-select');

    // Timezone selector and label
    const timezoneSelect = screen.getByLabelText(/^timezone$/i);
    expect(timezoneSelect).toBeInTheDocument();
    expect(timezoneSelect).toHaveAttribute('id', 'timezone-select');
  });

  // Test 3: ARIA Accessibility State Properties
  it('3. verifies that the grace days range slider reports correct ARIA bounds and values', () => {
    render(<AdvancedSettingsPanel {...defaultProps} grace={4} />);

    const graceSlider = screen.getByLabelText(/^grace days$/i);
    expect(graceSlider).toHaveAttribute('aria-valuemin', '0');
    expect(graceSlider).toHaveAttribute('aria-valuemax', '7');
    expect(graceSlider).toHaveAttribute('aria-valuenow', '4');
  });

  // Test 4: Keyboard Accessibility (Focus Management)
  it('4. verifies that interactive elements (checkboxes, inputs, selects, range controls) receive sequential focus', () => {
    render(<AdvancedSettingsPanel {...defaultProps} />);

    const titleCheckbox = screen.getByLabelText(/hide title/i);
    const viewSelect = screen.getByLabelText(/^view layout$/i);
    const widthInput = screen.getByLabelText(/^width$/i);
    const graceSlider = screen.getByLabelText(/^grace days$/i);
    const timezoneSelect = screen.getByLabelText(/^timezone$/i);

    titleCheckbox.focus();
    expect(document.activeElement).toBe(titleCheckbox);

    viewSelect.focus();
    expect(document.activeElement).toBe(viewSelect);

    widthInput.focus();
    expect(document.activeElement).toBe(widthInput);

    graceSlider.focus();
    expect(document.activeElement).toBe(graceSlider);

    timezoneSelect.focus();
    expect(document.activeElement).toBe(timezoneSelect);
  });

  // Test 5: Interactive Callback Propagation
  it('5. verifies that changing control options triggers their respective callback handlers', () => {
    const onHideTitleChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onBadgeWidthChange = vi.fn();
    const onGraceChange = vi.fn();

    render(
      <AdvancedSettingsPanel
        {...defaultProps}
        onHideTitleChange={onHideTitleChange}
        onViewModeChange={onViewModeChange}
        onBadgeWidthChange={onBadgeWidthChange}
        onGraceChange={onGraceChange}
      />
    );

    // Click checkbox
    const titleCheckbox = screen.getByLabelText(/hide title/i);
    fireEvent.click(titleCheckbox);
    expect(onHideTitleChange).toHaveBeenCalledWith(true);

    // Change Select value
    const viewSelect = screen.getByLabelText(/^view layout$/i);
    fireEvent.change(viewSelect, { target: { value: 'monthly' } });
    expect(onViewModeChange).toHaveBeenCalledWith('monthly');

    // Type in dimension input
    const widthInput = screen.getByLabelText(/^width$/i);
    fireEvent.change(widthInput, { target: { value: '450' } });
    expect(onBadgeWidthChange).toHaveBeenCalledWith(450);

    // Slide range slider
    const graceSlider = screen.getByLabelText(/^grace days$/i);
    fireEvent.change(graceSlider, { target: { value: '5' } });
    expect(onGraceChange).toHaveBeenCalledWith(5);
  });
});
