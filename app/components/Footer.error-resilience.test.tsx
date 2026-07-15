import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import '@testing-library/jest-dom/vitest';
import { Footer } from './Footer';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

let translationShouldReturnUndefined = false;

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, string>): string | undefined => {
      if (translationShouldReturnUndefined) return undefined;
      return key === 'footer.copyright' ? `© ${vars?.year ?? ''} CommitPulse` : key;
    },
  }),
}));

let shouldHomeThrow = false;
let shouldGithubThrow = false;

vi.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => {
    if (shouldHomeThrow) {
      throw new Error('FATAL_DB_DISCONNECT: Database connection timed out');
    }
    return <svg data-testid="icon-home" className={className} />;
  },
  Zap: () => null,
  GitCompare: () => null,
  Sliders: () => null,
  Users: () => null,
  MessageCircle: () => null,
  BookOpen: () => null,
  GitBranch: () => null,
  HelpCircle: () => null,
  Shield: () => <div>Shield</div>,
  FileText: () => <div>FileText</div>,
}));

vi.mock('react-icons/fa', () => ({
  FaGithub: () => {
    if (shouldGithubThrow) {
      throw new Error('FATAL_DB_DISCONNECT: Social icon service unavailable');
    }
    return null;
  },
  FaDiscord: () => null,
  FaLinkedin: () => null,
}));

vi.mock('react-icons/fa6', () => ({
  FaXTwitter: () => null,
}));

interface ErrorBoundaryProps {
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TestErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div data-testid="footer-error-fallback" role="alert">
          <h3>System Alert</h3>
          <p>Unexpected exception: {this.state.error?.message}</p>
          <button onClick={this.handleReset} data-testid="reset-button">
            Reset and Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('Footer Error Resilience', () => {
  beforeEach(() => {
    shouldHomeThrow = false;
    shouldGithubThrow = false;
    translationShouldReturnUndefined = false;
  });

  it('maintains hydration stability and renders without crashing under normal conditions', () => {
    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toBeInTheDocument();
    expect(screen.getByTestId('icon-home')).toBeInTheDocument();
  });

  it('safely catches a runtime exception from the Home icon (NAV_ICON_MAP nested child) inside a localized boundary', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldHomeThrow = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <Footer />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    expect(screen.getByTestId('footer-error-fallback')).toBeInTheDocument();
    expect(screen.getByText(/FATAL_DB_DISCONNECT/i)).toBeInTheDocument();
    expect(screen.queryByText('CommitPulse')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('safely catches a runtime exception from FaGithub (SOCIAL_ICON_MAP nested child) inside a localized boundary', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldGithubThrow = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <Footer />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    expect(screen.getByTestId('footer-error-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Social icon service unavailable/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('does not crash when the translation service returns undefined for all keys — t() is called for every label in Footer.tsx', () => {
    translationShouldReturnUndefined = true;

    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('does not crash when t() returns undefined for the footer.copyright interpolation key', () => {
    translationShouldReturnUndefined = true;

    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
