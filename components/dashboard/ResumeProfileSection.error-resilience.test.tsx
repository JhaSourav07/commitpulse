import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockTelemetry, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockTelemetry: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

let shouldThrowUpload = false;
let shouldThrowPreview = false;
let shouldThrowDbConnectivity = false;
let shouldTriggerParsed = false;

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, props.children),
  },
  AnimatePresence: (props: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, props.children),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock('./ResumeUpload', () => ({
  __esModule: true,
  default: function StubResumeUpload(props: {
    onParsed: (data: unknown, fileName: string) => void;
    onError: (message: string) => void;
  }) {
    if (shouldThrowUpload) {
      throw new Error('ResumeUpload render failure');
    }

    React.useEffect(() => {
      if (shouldThrowDbConnectivity) {
        setTimeout(() => props.onError('Database connectivity failed'), 0);
        throw new Error('Database connectivity error');
      }
      if (shouldTriggerParsed) {
        props.onParsed(
          {
            name: 'Resilient User',
            email: 'resilient@example.com',
            phone: '555-555-5555',
            skills: [],
            education: [],
            experience: [],
          },
          'resilient.pdf'
        );
      }
    }, [props]);

    return (
      <button
        onClick={() =>
          props.onParsed(
            {
              name: 'Resilient User',
              email: 'resilient@example.com',
              phone: '555-555-5555',
              skills: [],
              education: [],
              experience: [],
            },
            'resilient.pdf'
          )
        }
      >
        Trigger Parse
      </button>
    );
  },
}));

vi.mock('./ResumePreviewForm', () => ({
  __esModule: true,
  default: function StubResumePreviewForm() {
    if (shouldThrowPreview) {
      throw new Error('ResumePreviewForm render failure');
    }

    return <div>Resume preview rendered successfully</div>;
  },
}));

import ResumeProfileSection from './ResumeProfileSection';

class TestErrorBoundary extends React.Component<
  { onReset: () => void; children: React.ReactNode },
  { caughtError: Error | null }
> {
  constructor(props: { onReset: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { caughtError: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { caughtError: error };
  }

  componentDidCatch(error: Error) {
    mockTelemetry(error.message);
  }

  handleReset() {
    this.setState({ caughtError: null });
    this.props.onReset();
  }

  render() {
    if (this.state.caughtError) {
      return (
        <div role="alert">
          <p>Something went wrong.</p>
          <button onClick={this.handleReset}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

describe('ResumeProfileSection Error Resilience', () => {
  beforeEach(() => {
    mockTelemetry.mockClear();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    shouldThrowUpload = false;
    shouldThrowPreview = false;
    shouldThrowDbConnectivity = false;
    shouldTriggerParsed = false;
  });

  afterEach(() => {
    shouldThrowUpload = false;
    shouldThrowPreview = false;
    shouldThrowDbConnectivity = false;
    shouldTriggerParsed = false;
  });

  it('renders a clean recovery panel when ResumeUpload throws during render', async () => {
    shouldThrowUpload = true;
    const onReset = vi.fn();

    render(
      <TestErrorBoundary onReset={onReset}>
        <ResumeProfileSection githubUsername="octocat" />
      </TestErrorBoundary>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText('Something went wrong.')).toBeDefined();
    expect(screen.getByText('Reload')).toBeDefined();
    expect(mockTelemetry).toHaveBeenCalledWith('ResumeUpload render failure');

    fireEvent.click(screen.getByText('Reload'));
    expect(onReset).toHaveBeenCalled();
  });

  it('captures preview rendering failures and surfaces telemetry', async () => {
    shouldTriggerParsed = true;
    shouldThrowPreview = true;

    render(
      <TestErrorBoundary onReset={vi.fn()}>
        <ResumeProfileSection githubUsername="octocat" />
      </TestErrorBoundary>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(mockTelemetry).toHaveBeenCalledWith('ResumePreviewForm render failure');
    expect(screen.getByText('Reload')).toBeDefined();
  });

  it('logs database connectivity style errors and still recovers to a stable UI', async () => {
    shouldThrowDbConnectivity = true;

    render(
      <TestErrorBoundary onReset={vi.fn()}>
        <ResumeProfileSection githubUsername="octocat" />
      </TestErrorBoundary>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(mockToastError).toHaveBeenCalledWith('Database connectivity failed');
    expect(mockTelemetry).toHaveBeenCalledWith('Database connectivity error');
  });

  it('provides a visible reload path on the recovery panel', async () => {
    shouldThrowUpload = true;
    const onReset = vi.fn();

    render(
      <TestErrorBoundary onReset={onReset}>
        <ResumeProfileSection githubUsername="octocat" />
      </TestErrorBoundary>
    );

    await screen.findByRole('alert');
    const reloadButton = screen.getByText('Reload');
    expect(reloadButton).toBeTruthy();
    fireEvent.click(reloadButton);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('recovers on retry after a nested preview error and renders normal content again', async () => {
    shouldTriggerParsed = true;
    shouldThrowPreview = true;
    let boundaryKey = 0;
    const resetBoundary = vi.fn(() => {
      shouldThrowPreview = false;
      boundaryKey += 1;
    });

    const { rerender } = render(
      <TestErrorBoundary onReset={resetBoundary}>
        <ResumeProfileSection key={boundaryKey} githubUsername="octocat" />
      </TestErrorBoundary>
    );

    await screen.findByRole('alert');
    fireEvent.click(screen.getByText('Reload'));

    rerender(
      <TestErrorBoundary onReset={resetBoundary}>
        <ResumeProfileSection key={boundaryKey} githubUsername="octocat" />
      </TestErrorBoundary>
    );

    expect(resetBoundary).toHaveBeenCalled();
    expect(await screen.findByText('Resume preview rendered successfully')).toBeDefined();
  });
});
