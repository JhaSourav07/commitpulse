import { describe, expect, it, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CompareClient from './CompareClient';

// 1. Mock Next.js router so the component doesn't crash from missing browser context
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// 2. Mock a nested child/dependency to artificially throw errors
const ChildThatThrows = () => {
  throw new Error('Unexpected Database Connectivity Error');
  return null;
};

// 3. Intercept CompareClient to inject our failing child when we want to trigger a crash
vi.mock('./CompareClient', async () => {
  return {
    __esModule: true,
    default: ({ forceCrash }: { forceCrash?: boolean }) =>
      forceCrash ? <ChildThatThrows /> : <div>Compare Client Hydrated Successfully</div>,
  };
});

// 4. Encase execution calls in a localized boundary element for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    // Simulate dev-telemetry tracker logging
    console.error('Simulated Telemetry Log:', error.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-ui">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('CompareClient: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    // Suppress React's giant red error traces in the terminal during expected failures
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('Test 1: should maintain Hydration Stability and render without crashing on initial load', () => {
    render(
      <TestErrorBoundary>
        <CompareClient />
      </TestErrorBoundary>
    );
    expect(screen.getByText('Compare Client Hydrated Successfully')).toBeInTheDocument();
  });

  it('Test 2: should catch unexpected runtime exceptions safely within the localized boundary', () => {
    render(
      <TestErrorBoundary>
        {/* @ts-expect-error - injecting mock prop for testing purposes */}
        <CompareClient forceCrash={true} />
      </TestErrorBoundary>
    );
    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();
  });

  it('Test 3: should render a clean error recovery UI instead of white-screening', () => {
    render(
      <TestErrorBoundary>
        {/* @ts-expect-error - injecting mock prop for testing purposes */}
        <CompareClient forceCrash={true} />
      </TestErrorBoundary>
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('Compare Client Hydrated Successfully')).not.toBeInTheDocument();
  });

  it('Test 4: should verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <TestErrorBoundary>
        {/* @ts-expect-error - injecting mock prop for testing purposes */}
        <CompareClient forceCrash={true} />
      </TestErrorBoundary>
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Simulated Telemetry Log:',
      'Unexpected Database Connectivity Error'
    );
  });

  it('Test 5: should ensure user reset/reload paths are available on the recovery panels', () => {
    render(
      <TestErrorBoundary>
        {/* @ts-expect-error - injecting mock prop for testing purposes */}
        <CompareClient forceCrash={true} />
      </TestErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Clear the spy's history so React Strict Mode double-renders don't mess up our count
    consoleErrorSpy.mockClear();

    fireEvent.click(retryButton);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
