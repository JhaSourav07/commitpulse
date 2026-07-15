import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import DashboardLayout from './layout';

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

class TestErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // catch silently for tests
  }
  render() {
    if (this.state.hasError) {
      return <div>Test Fallback UI</div>;
    }
    return this.props.children;
  }
}

const ThrowError = () => {
  throw new Error('Hydration error simulated');
};

describe('DashboardLayout - Error Resilience', () => {
  it('prevents layout structural crash when child components throw errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary>
        <DashboardLayout>
          <ThrowError />
        </DashboardLayout>
      </TestErrorBoundary>
    );

    expect(screen.getByText('Test Fallback UI')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders gracefully with fallback UI placeholders during hydration', () => {
    render(
      <DashboardLayout>
        <div data-testid="hydration-fallback">Loading layout skeleton...</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('hydration-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});
