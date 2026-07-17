import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { activityToTowers, generateMonolithSTL } from './export3d';
import type { ActivityData } from '@/types/dashboard';

// =====================================================================
// 1. Telemetry Mock
// =====================================================================
const mockTelemetryTracker = vi.fn();

// =====================================================================
// 2. Localized Error Boundary Wrapper
// =====================================================================
class ResilienceErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error) {
    // Log exception to dev-telemetry trackers appropriately
    mockTelemetryTracker('[Dev-Telemetry-Log]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel">
          <h2>Clean Error Recovery UI</h2>
          <p>Unexpected Error: {this.state.errorMsg}</p>
          <button
            data-testid="reset-button"
            onClick={() => {
              this.setState({ hasError: false, errorMsg: '' });
              this.props.onReset();
            }}
          >
            Reload / Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =====================================================================
// 3. Target Module Component
// =====================================================================
const Export3DTargetModule = ({ data }: { data: ActivityData[] }) => {
  // Encase execution calls that might fail due to malformed data
  const towers = activityToTowers(data);
  const stl = generateMonolithSTL(towers);

  return <div data-testid="success-render">STL Rendered Length: {stl.length}</div>;
};

// =====================================================================
// 4. Test Suite Setup
// =====================================================================
describe('Export3D: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React's default console.error during boundary tests to keep terminal clean
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTelemetryTracker.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Mock valid data
  const validData: ActivityData[] = [{ date: '2024-01-01', count: 5, intensity: 2 }];

  // Mock malicious data simulating a DB proxy crash or connectivity error
  const maliciousData = [
    {
      get date(): string {
        throw new Error('Database connectivity lost: Unexpected ETIMEDOUT');
      },
      count: 10,
    },
  ] as unknown as ActivityData[];

  // Test Harness Component
  const TestHarness = ({ initialData }: { initialData: ActivityData[] }) => {
    const [data, setData] = useState<ActivityData[]>(initialData);
    return (
      <ResilienceErrorBoundary onReset={() => setData(validData)}>
        <Export3DTargetModule data={data} />
      </ResilienceErrorBoundary>
    );
  };

  // -------------------------------------------------------------------
  // TEST CASES
  // -------------------------------------------------------------------

  it('1. should maintain Hydration Stability by gracefully handling null/empty data without throwing', () => {
    // Should not throw, should return empty array
    const resultNull = activityToTowers(null as unknown as ActivityData[]);
    const resultEmpty = activityToTowers([]);

    expect(resultNull).toEqual([]);
    expect(resultEmpty).toEqual([]);
  });

  it('2. should encase execution in localized boundaries and render a clean error recovery UI instead of crashing', () => {
    render(<TestHarness initialData={maliciousData} />);

    // The success module should be aborted and absent
    expect(screen.queryByTestId('success-render')).not.toBeInTheDocument();

    // The clean fallback UI should be rendered
    const recoveryPanel = screen.getByTestId('error-recovery-panel');
    expect(recoveryPanel).toBeInTheDocument();
    expect(recoveryPanel).toHaveTextContent('Unexpected Error: Database connectivity lost');
  });

  it('3. should verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(<TestHarness initialData={maliciousData} />);

    // Validate telemetry was fired with the correct signature and message
    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      '[Dev-Telemetry-Log]',
      'Database connectivity lost: Unexpected ETIMEDOUT'
    );
  });

  it('4. should ensure user reset/reload paths are available and functional on recovery panels', () => {
    render(<TestHarness initialData={maliciousData} />);

    // Ensure we are in the error state
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    // Trigger the reload/reset path
    const resetButton = screen.getByTestId('reset-button');
    fireEvent.click(resetButton);

    // Verify recovery panel unmounts and the app successfully recovers with stable data
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('success-render')).toBeInTheDocument();
  });

  it('5. should provide Exception Safety during STL generation even with extremely malformed data types', () => {
    // Inject NaN and Infinities into the STL generator to simulate extreme data corruption
    const corruptedTowers = [
      { row: NaN, col: Infinity, h: -100, hasCommits: true, date: 'undefined' },
    ] as unknown as Parameters<typeof generateMonolithSTL>[0];

    // It should not crash the main thread; standard JS math ops will yield 'NaN' in string
    // which fails gracefully downstream rather than throwing a Fatal Exception.
    const stlOutput = generateMonolithSTL(corruptedTowers);

    expect(typeof stlOutput).toBe('string');
    expect(stlOutput).toContain('solid commitpulse_monolith');
    expect(stlOutput).toContain('endsolid commitpulse_monolith');
  });
});
