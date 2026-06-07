import type { ComponentProps, ReactNode } from 'react';
import { Component } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LanguageChart, { buildGradientStops } from './LanguageChart';
import type { LanguageData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      role,
      tabIndex,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'data-testid': testId,
    }: ComponentProps<'div'> & { [key: string]: unknown }) => (
      <div
        className={className}
        style={style}
        role={role}
        tabIndex={tabIndex}
        aria-label={ariaLabel as string}
        aria-labelledby={ariaLabelledBy as string}
        data-testid={testId as string}
      >
        {children}
      </div>
    ),
  },
}));

// Minimal error boundary used to catch render-time exceptions in tests.
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Something went wrong</div>;
    }
    return this.props.children;
  }
}

function withErrorBoundary(ui: ReactNode) {
  return render(<ErrorBoundary>{ui}</ErrorBoundary>);
}

const validLanguages: LanguageData[] = [
  { name: 'TypeScript', color: '#3178c6', percentage: 70 },
  { name: 'JavaScript', color: '#f7df1e', percentage: 30 },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LanguageChart — error resilience', () => {
  it('renders an empty-state fallback instead of crashing when languages is an empty array', () => {
    withErrorBoundary(<LanguageChart languages={[]} />);
    expect(screen.getByText('No language data found')).toBeTruthy();
    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });

  it('does not crash when a language entry has a zero percentage', () => {
    const langs: LanguageData[] = [{ name: 'TypeScript', color: '#3178c6', percentage: 0 }];
    withErrorBoundary(<LanguageChart languages={langs} />);
    expect(screen.queryByTestId('error-fallback')).toBeNull();
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('buildGradientStops returns an empty string for an empty array without throwing', () => {
    expect(() => buildGradientStops([])).not.toThrow();
    expect(buildGradientStops([])).toBe('');
  });

  it('buildGradientStops produces a valid conic-gradient string for valid input', () => {
    const result = buildGradientStops(validLanguages);
    expect(result).toContain('#3178c6');
    expect(result).toContain('#f7df1e');
    expect(result).toContain('0%');
  });

  it('renders without crashing when provided a single language entry', () => {
    const langs: LanguageData[] = [{ name: 'Rust', color: '#dea584', percentage: 100 }];
    withErrorBoundary(<LanguageChart languages={langs} />);
    expect(screen.queryByTestId('error-fallback')).toBeNull();
    expect(screen.getAllByText('Rust').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });
});
