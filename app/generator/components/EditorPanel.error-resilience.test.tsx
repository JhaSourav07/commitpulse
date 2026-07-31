import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

const mockTelemetryTracker = vi.fn();

let shouldCrash = false;

vi.mock('./sections/NameSection', () => ({
  NameSection: () => {
    if (shouldCrash) {
      throw new Error('Simulated Runtime Error');
    }

    return <div data-testid="healthy-name-section">NameSection</div>;
  },
}));
vi.mock('./sections/DescriptionSection', () => ({
  DescriptionSection: () => <div>DescriptionSection</div>,
}));

vi.mock('./sections/TechnologiesSection', () => ({
  TechnologiesSection: () => <div>TechnologiesSection</div>,
}));

vi.mock('./sections/SocialsSection', () => ({
  SocialsSection: () => <div>SocialsSection</div>,
}));

vi.mock('./sections/CommitPulseSection', () => ({
  CommitPulseSection: () => <div>CommitPulseSection</div>,
}));

vi.mock('./sections/ContributionGraphSection', () => ({
  ContributionGraphSection: () => <div>ContributionGraphSection</div>,
}));

vi.mock('./sections/RepoSpotlightSection', () => ({
  RepoSpotlightSection: () => <div>RepoSpotlightSection</div>,
}));

vi.mock('./GitHubImportModal', () => ({
  GitHubImportModal: () => <div>GitHubImportModal</div>,
}));
function FallbackRecoveryUI({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" data-testid="error-recovery-panel">
      <h2>EditorPanel Failed</h2>

      <p>{error instanceof Error ? error.message : String(error)}</p>

      <button onClick={resetErrorBoundary}>Retry</button>
    </div>
  );
}
describe('EditorPanel — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  const mockState: GeneratorState = {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: '',
    showCommitPulse: false,
    commitPulseAccent: '',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
  };

  const defaultProps = {
    state: mockState,
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onTechsChange: vi.fn(),
    onSocialsChange: vi.fn(),
    onSocialLinkChange: vi.fn(),
    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
    onApplyImport: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    shouldCrash = false;

    vi.clearAllMocks();

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('encases execution in a localized boundary and prevents application crashes', () => {
    shouldCrash = true;

    expect(() => {
      render(
        <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
          <EditorPanel {...defaultProps} />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });
  it('renders a recovery UI instead of crashing when an exception occurs', () => {
    shouldCrash = true;

    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        <EditorPanel {...defaultProps} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    expect(screen.getByText('EditorPanel Failed')).toBeInTheDocument();

    expect(screen.getByText('Simulated Runtime Error')).toBeInTheDocument();

    expect(screen.queryByTestId('healthy-name-section')).not.toBeInTheDocument();
  });
  it('logs unexpected runtime exceptions to telemetry handlers', () => {
    shouldCrash = true;

    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        <EditorPanel {...defaultProps} />
      </ErrorBoundary>
    );

    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);

    const error = mockTelemetryTracker.mock.calls[0][0];

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Simulated Runtime Error');
  });
  it('provides a retry path and invokes reset handling', () => {
    shouldCrash = true;

    const onReset = vi.fn();

    render(
      <ErrorBoundary
        FallbackComponent={FallbackRecoveryUI}
        onError={mockTelemetryTracker}
        onReset={onReset}
      >
        <EditorPanel {...defaultProps} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', {
      name: /retry/i,
    });

    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
  it('renders normally without fallback UI when no exception occurs', () => {
    shouldCrash = false;

    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        <EditorPanel {...defaultProps} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('healthy-name-section')).toBeInTheDocument();

    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();

    expect(mockTelemetryTracker).not.toHaveBeenCalled();
  });
});
