import React, { Component } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';
import * as ThemeSelector from './ThemeSelector';
import type { ViewMode, DeltaFormat, Language, Timezone } from '../types';

// --- Telemetry Tracker Mock/Spy ---
const mockTelemetry = {
  logError: vi.fn(),
};

// --- Localized Error Boundary for Fallback UI Tests ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TestingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error): void {
    mockTelemetry.logError(error);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-label="Error Recovery Panel">
          <h3>Something went wrong.</h3>
          <button type="button" onClick={this.handleReset}>
            Retry and Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Component Props Mock Configuration ---
const defaultProps = {
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'compact' as ViewMode,
  deltaFormat: 'absolute' as DeltaFormat,
  badgeWidth: 400 as const,
  badgeHeight: 200 as const,
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

describe('AdvancedSettingsPanel Error Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  // --- Test Case 1: Hydration Stability under Server/Client Mismatch ---
  it('should maintain stability and render safely during initial server/client mismatch states', () => {
    const mismatchedProps = {
      ...defaultProps,
      badgeWidth: '' as const,
      viewMode: undefined as unknown as ViewMode,
    };

    const { container } = render(<AdvancedSettingsPanel {...mismatchedProps} />);

    const section = screen.getByRole('region', { name: /Advanced Settings Configuration/i });
    expect(section).toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  // --- Test Case 2: Exception Safety when Child Properties Throw Errors ---
  it('should isolate crashes when a child component throws an unexpected runtime exception', () => {
    vi.spyOn(ThemeSelector, 'StyledSelect').mockImplementation(() => {
      throw new Error('Unexpected runtime exception or database connectivity error');
    });

    expect(() => {
      render(
        <TestingErrorBoundary>
          <AdvancedSettingsPanel {...defaultProps} />
        </TestingErrorBoundary>
      );
    }).not.toThrow();
  });

  // --- Test Case 3: Error Fallback UI Rendering (Localized Boundary) ---
  it('should render a clean error recovery UI instead of hard-crashing the application', () => {
    vi.spyOn(ThemeSelector, 'StyledSelect').mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    render(
      <TestingErrorBoundary>
        <AdvancedSettingsPanel {...defaultProps} />
      </TestingErrorBoundary>
    );

    const errorPanel = screen.getByRole('alert');
    expect(errorPanel).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  // --- Test Case 4: Dev-Telemetry Logging Verification ---
  it('should log the caught runtime exception to the dev-telemetry trackers', () => {
    const errorObj = new Error('Telemetry tracked crash condition');
    vi.spyOn(ThemeSelector, 'StyledSelect').mockImplementation(() => {
      throw errorObj;
    });

    render(
      <TestingErrorBoundary>
        <AdvancedSettingsPanel {...defaultProps} />
      </TestingErrorBoundary>
    );

    expect(mockTelemetry.logError).toHaveBeenCalledTimes(1);
    expect(mockTelemetry.logError).toHaveBeenCalledWith(errorObj);
  });

  // --- Test Case 5: User Reset / Reload Paths Availability ---
  it('should provide an interactive recovery path or reload button to reset the UI state', () => {
    vi.spyOn(ThemeSelector, 'StyledSelect').mockImplementation(() => {
      throw new Error('Crash for recovery path check');
    });

    render(
      <TestingErrorBoundary>
        <AdvancedSettingsPanel {...defaultProps} />
      </TestingErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /retry and reload/i });
    expect(retryButton).toBeInTheDocument();

    // Cleanly mock the select interface without breaking strictly typed attributes
    vi.spyOn(ThemeSelector, 'StyledSelect').mockImplementation(
      ({ children, id, value, onChange }) => (
        <select id={id} value={value} onChange={(e) => onChange?.(e.target.value)}>
          {children}
        </select>
      )
    );

    // Simulate recovery action path click
    fireEvent.click(retryButton);

    // Fixed the compilation issue: Using proper Jest/Vitest DOM element assertion matcher
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /Advanced Settings Configuration/i })
    ).toBeInTheDocument();
  });
});
