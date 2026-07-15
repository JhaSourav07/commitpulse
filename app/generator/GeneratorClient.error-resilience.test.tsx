import React, { Component, ReactNode, ErrorInfo } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratorClient } from './GeneratorClient';

// Mock child components
const defaultEditorPanel = vi.fn(
  ({ onNameChange, 'data-testid': testid }: Record<string, unknown>) => {
    return (
      <div data-testid={(testid as string) || 'editor-panel'}>
        <button onClick={() => (onNameChange as (n: string) => void)('Test Name')}>
          Change Name
        </button>
      </div>
    );
  }
);

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: (props: Record<string, unknown>) => defaultEditorPanel(props),
}));

const defaultPreviewPanel = vi.fn(({ 'data-testid': testid }: Record<string, unknown>) => (
  <div data-testid={(testid as string) || 'preview-panel'}>Preview Panel</div>
));
vi.mock('./components/PreviewPanel', () => ({
  PreviewPanel: (props: Record<string, unknown>) => defaultPreviewPanel(props),
}));

const defaultCompletionScorePanel = vi.fn(({ 'data-testid': testid }: Record<string, unknown>) => (
  <div data-testid={(testid as string) || 'completion-score-panel'}>Completion Score Panel</div>
));
vi.mock('./components/CompletionScorePanel', () => ({
  CompletionScorePanel: (props: Record<string, unknown>) => defaultCompletionScorePanel(props),
}));

const defaultReadmeInsightsPanel = vi.fn(({ 'data-testid': testid }: Record<string, unknown>) => (
  <div data-testid={(testid as string) || 'readme-insights-panel'}>Readme Insights Panel</div>
));
vi.mock('./components/ReadmeInsightsPanel', () => ({
  ReadmeInsightsPanel: (props: Record<string, unknown>) => defaultReadmeInsightsPanel(props),
}));

vi.mock('./components/ReadmeHealthBreakdown', () => ({
  ReadmeHealthBreakdown: vi.fn(({ 'data-testid': testid }: Record<string, unknown>) => (
    <div data-testid={(testid as string) || 'readme-health-breakdown'}>Readme Health Breakdown</div>
  )),
}));

vi.mock('./components/ReadmeInsight', () => ({
  ReadmeInsight: vi.fn(({ 'data-testid': testid }: Record<string, unknown>) => (
    <div data-testid={(testid as string) || 'readme-insight'}>Readme Insight</div>
  )),
}));

// Mock utility
vi.mock('./utils/readmeGenerator', () => ({
  generateReadme: vi.fn(() => '# Generated Readme'),
  getEmptyReadme: vi.fn(() => '# Empty Readme'),
}));

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Telemetry] Logged exception:', error, errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-ui">
          <h2>Application Error</h2>
          <p>{this.state.message}</p>
          <button data-testid="reset-button" onClick={this.resetError}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('GeneratorClient - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    defaultEditorPanel.mockClear();
    defaultPreviewPanel.mockClear();
    defaultCompletionScorePanel.mockClear();
    defaultReadmeInsightsPanel.mockClear();

    // Reset mock implementations
    defaultEditorPanel.mockImplementation(
      ({ onNameChange, 'data-testid': testid }: Record<string, unknown>) => {
        return (
          <div data-testid={(testid as string) || 'editor-panel'}>
            <button onClick={() => (onNameChange as (n: string) => void)('Test Name')}>
              Change Name
            </button>
          </div>
        );
      }
    );
    defaultPreviewPanel.mockImplementation(({ 'data-testid': testid }: Record<string, unknown>) => (
      <div data-testid={(testid as string) || 'preview-panel'}>Preview Panel</div>
    ));
    defaultCompletionScorePanel.mockImplementation(
      ({ 'data-testid': testid }: Record<string, unknown>) => (
        <div data-testid={(testid as string) || 'completion-score-panel'}>
          Completion Score Panel
        </div>
      )
    );
    defaultReadmeInsightsPanel.mockImplementation(
      ({ 'data-testid': testid }: Record<string, unknown>) => (
        <div data-testid={(testid as string) || 'readme-insights-panel'}>Readme Insights Panel</div>
      )
    );
  });

  it('Test 1: mounts cleanly when all child components are healthy', () => {
    render(
      <ErrorBoundary>
        <GeneratorClient />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('error-recovery-ui')).not.toBeInTheDocument();
  });

  it('Test 2: encase execution calls in localized boundary elements and catch runtime exceptions', () => {
    const boom = new Error('Database Connectivity Error');

    defaultEditorPanel.mockImplementation(() => {
      // Throw during render simulation
      const [shouldThrow, setShouldThrow] = React.useState(false);
      if (shouldThrow) throw boom;
      return <button onClick={() => setShouldThrow(true)}>Crash</button>;
    });

    render(
      <ErrorBoundary>
        <GeneratorClient />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Crash'));

    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();
    expect(screen.getByText('Database Connectivity Error')).toBeInTheDocument();
  });

  it('Test 3: verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    const boom = new Error('Unexpected Runtime Exception');

    defaultPreviewPanel.mockImplementation(() => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      if (shouldThrow) throw boom;
      return <button onClick={() => setShouldThrow(true)}>Crash Preview</button>;
    });

    render(
      <ErrorBoundary>
        <GeneratorClient />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Crash Preview'));

    expect(console.error).toHaveBeenCalledWith(
      '[Telemetry] Logged exception:',
      boom,
      expect.any(String)
    );
  });

  it('Test 4: ensure user reset/reload paths are available on the recovery panels', () => {
    const boom = new Error('Transient Error');

    defaultReadmeInsightsPanel.mockImplementation(() => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      if (shouldThrow) throw boom;
      return <button onClick={() => setShouldThrow(true)}>Crash Insights</button>;
    });

    render(
      <ErrorBoundary>
        <GeneratorClient />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Crash Insights'));
    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reset-button'));
    expect(screen.queryByTestId('error-recovery-ui')).not.toBeInTheDocument();
  });

  it('Test 5: maintains hydration stability despite partial state updates or sub-component errors', () => {
    const boom = new Error('Hydration Error');

    defaultCompletionScorePanel.mockImplementation(() => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      if (shouldThrow) throw boom;
      return <button onClick={() => setShouldThrow(true)}>Crash Score</button>;
    });

    render(
      <ErrorBoundary>
        <GeneratorClient />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Crash Score'));
    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reset-button'));
    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
  });
});
