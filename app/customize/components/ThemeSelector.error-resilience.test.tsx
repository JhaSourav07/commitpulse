import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

// 1. MOCK ALL DEPENDENCIES FULLY
vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="mock-presets">Presets</div>,
}));

vi.mock('./SectionLabel', () => ({
  SectionLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../lib/svg/themes', () => ({
  themes: {
    dracula: { bg: '000', accent: '000', text: '000' },
    neon: { bg: '000', accent: '000', text: '000' },
    ocean: { bg: '000', accent: '000', text: '000' },
    sunset: { bg: '000', accent: '000', text: '000' },
    light: { bg: '000', accent: '000', text: '000' },
    dark: { bg: '000', accent: '000', text: '000' },
  },
}));

vi.mock('../types', () => ({
  THEME_KEYS: ['dracula', 'neon', 'ocean', 'sunset', 'auto', 'random'],
}));

// 2. Error Boundary
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
  render() {
    if (this.state.hasError) return <div data-testid="error-fallback">Error</div>;
    return this.props.children;
  }
}

describe('ThemeSelector Resilience', () => {
  it('should render successfully with a valid theme', () => {
    render(
      <TestErrorBoundary>
        <ThemeSelector theme="dracula" onThemeChange={vi.fn()} />
      </TestErrorBoundary>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
  });

  it('should handle invalid theme strings gracefully without crashing', () => {
    // This tests if the component handles bad inputs without throwing exceptions
    render(
      <TestErrorBoundary>
        <ThemeSelector theme="not-a-real-theme" onThemeChange={vi.fn()} />
      </TestErrorBoundary>
    );
    expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
  });

  it('should render gracefully with undefined theme prop', () => {
    render(
      <TestErrorBoundary>
        <ThemeSelector theme={undefined as unknown as string} onThemeChange={vi.fn()} />
      </TestErrorBoundary>
    );
    expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
  });

  it('should catch crashes in children via Error Boundary', () => {
    // Force a child component to crash
    const CrashingChild = () => {
      throw new Error('Crash');
    };

    render(
      <TestErrorBoundary>
        <ThemeSelector theme="dracula" onThemeChange={vi.fn()} />
        <CrashingChild />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
