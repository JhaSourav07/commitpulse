import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';

const createDefaultProps = (overrides = {}) => ({
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default' as ViewMode,
  deltaFormat: 'absolute' as DeltaFormat,
  badgeWidth: 300 as number | '',
  badgeHeight: 150 as number | '',
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
  ...overrides,
});

describe('AdvancedSettingsPanel - Component & State Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Renders complete UI and verifies accessibility tree / region
  it('1. renders all controlled components inside the configuration region', () => {
    const props = createDefaultProps();
    render(<AdvancedSettingsPanel {...props} />);

    // Verify main region and section header
    expect(
      screen.getByRole('region', { name: /Advanced Settings Configuration/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();

    // Verify visibility checkboxes
    expect(screen.getByLabelText(/Hide Title/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Hide Background/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Hide Stats/i)).not.toBeChecked();

    // Verify inputs, selects, and range slider
    expect(screen.getByLabelText(/View Layout/i)).toHaveValue('default');
    expect(screen.getByLabelText(/Delta Format/i)).toHaveValue('absolute');
    expect(screen.getByLabelText(/Width/i)).toHaveValue(300);
    expect(screen.getByLabelText(/Height/i)).toHaveValue(150);
    expect(screen.getByLabelText(/Grace Days/i)).toHaveValue('3');
  });

  // Test Case 2: Visibility toggles and grace slider callback execution
  it('2. triggers corresponding callbacks when visibility checkboxes and grace slider are updated', () => {
    const props = createDefaultProps();
    render(<AdvancedSettingsPanel {...props} />);

    const hideTitleCheckbox = screen.getByLabelText(/Hide Title/i);
    const hideBgCheckbox = screen.getByLabelText(/Hide Background/i);
    const hideStatsCheckbox = screen.getByLabelText(/Hide Stats/i);
    const graceSlider = screen.getByLabelText(/Grace Days/i);

    fireEvent.click(hideTitleCheckbox);
    expect(props.onHideTitleChange).toHaveBeenCalledWith(true);

    fireEvent.click(hideBgCheckbox);
    expect(props.onHideBackgroundChange).toHaveBeenCalledWith(true);

    fireEvent.click(hideStatsCheckbox);
    expect(props.onHideStatsChange).toHaveBeenCalledWith(true);

    fireEvent.change(graceSlider, { target: { value: '5' } });
    expect(props.onGraceChange).toHaveBeenCalledWith(5);
  });

  // Test Case 3: Select dropdown integrations with exact valid types
  it('3. updates layout, delta format, and locale selections via dropdown change handlers', () => {
    const props = createDefaultProps();
    render(<AdvancedSettingsPanel {...props} />);

    const viewSelect = screen.getByLabelText(/View Layout/i);
    fireEvent.change(viewSelect, { target: { value: 'monthly' } });
    expect(props.onViewModeChange).toHaveBeenCalledWith('monthly');

    const deltaSelect = screen.getByLabelText(/Delta Format/i);
    fireEvent.change(deltaSelect, { target: { value: 'percent' } });
    expect(props.onDeltaFormatChange).toHaveBeenCalledWith('percent');

    const langSelect = screen.getByLabelText(/Language/i);
    fireEvent.change(langSelect, { target: { value: 'es' } });
    expect(props.onLanguageChange).toHaveBeenCalledWith('es');

    const tzSelect = screen.getByLabelText(/Timezone/i);
    fireEvent.change(tzSelect, { target: { value: 'Asia/Kolkata' } });
    expect(props.onTimezoneChange).toHaveBeenCalledWith('Asia/Kolkata');
  });

  // Test Case 4: Numeric dimension parsing with valueAsNumber
  it('4. correctly handles badge width and height numeric inputs', () => {
    const props = createDefaultProps();
    render(<AdvancedSettingsPanel {...props} />);

    const widthInput = screen.getByLabelText(/Width/i);
    const heightInput = screen.getByLabelText(/Height/i);

    fireEvent.change(widthInput, {
      target: { value: '500', valueAsNumber: 500 },
    });
    expect(props.onBadgeWidthChange).toHaveBeenCalledWith(500);

    fireEvent.change(heightInput, {
      target: { value: '250', valueAsNumber: 250 },
    });
    expect(props.onBadgeHeightChange).toHaveBeenCalledWith(250);
  });

  // Test Case 5: Controlled state propagation using deterministic fake timers
  it('5. synchronizes state across deferred parent updates without crashing', () => {
    vi.useFakeTimers();

    try {
      function ControlledTestHarness() {
        const [viewMode, setViewMode] = React.useState<ViewMode>('default');
        const [isPending, setIsPending] = React.useState<boolean>(false);

        const handleViewChange = (newMode: ViewMode) => {
          setIsPending(true);
          setTimeout(() => {
            setViewMode(newMode);
            setIsPending(false);
          }, 100);
        };

        return (
          <div>
            {isPending && <span data-testid="async-indicator">Syncing...</span>}
            <AdvancedSettingsPanel
              {...createDefaultProps({
                viewMode,
                onViewModeChange: handleViewChange,
              })}
            />
          </div>
        );
      }

      render(<ControlledTestHarness />);

      const viewSelect = screen.getByLabelText(/View Layout/i);
      fireEvent.change(viewSelect, { target: { value: 'pulse' } });

      expect(screen.getByTestId('async-indicator')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.queryByTestId('async-indicator')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/View Layout/i)).toHaveValue('pulse');
    } finally {
      vi.useRealTimers();
    }
  });
});
