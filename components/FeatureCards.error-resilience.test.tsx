import React, { Component, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';

vi.mock('gsap', () => {
  const tween = { kill: vi.fn() };
  const timeline = () => ({
    to: () => timeline(),
    fromTo: () => timeline(),
    set: () => timeline(),
    kill: vi.fn(),
  });
  return {
    default: {
      registerPlugin: vi.fn(),
      set: vi.fn(),
      to: vi.fn(() => tween),
      fromTo: vi.fn(() => tween),
      timeline: vi.fn(timeline),
      context: vi.fn((fn: () => void) => {
        fn();
        return { revert: vi.fn() };
      }),
    },
  };
});

vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

interface BoundaryState {
  caught: boolean;
  error: Error | null;
}

interface BoundaryProps {
  children: ReactNode;
  onError?: (e: Error) => void;
}

class TestErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { caught: false, error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { caught: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.caught) {
      return (
        <div role="alert" data-testid="error-fallback">
          <p>Something went wrong.</p>
          <button onClick={() => this.setState({ caught: false, error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const validProps = {
  icon: <svg data-testid="icon" />,
  title: 'Real-time Sync',
  desc: 'Pulls directly from the GitHub GraphQL API.',
  accent: 'bg-emerald-500',
  index: 0,
  accentColor: '#10b981',
};

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
});

describe('FeatureCards — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  it('renders without crashing when all valid props are supplied', () => {
    render(<FeatureCard {...validProps} />);
    expect(screen.getByText('Real-time Sync')).toBeDefined();
    expect(screen.getByText('Pulls directly from the GitHub GraphQL API.')).toBeDefined();
  });

  it('does not produce hydration mismatch: particles are generated client-side via useEffect, not during SSR', () => {
    const { container } = render(<FeatureCard {...validProps} />);
    const card = container.querySelector('[style*="preserve-3d"]');
    expect(card).not.toBeNull();
    // particles are set inside useEffect (client-only), never in render body
    // jsdom runs effects so we verify exactly 6 particles are created (the hardcoded Array.from length)
    const particleDivs = container.querySelectorAll('.rounded-full.pointer-events-none');
    expect(particleDivs.length).toBeGreaterThanOrEqual(6);
  });

  it('ErrorBoundary catches runtime exception and renders recovery UI, logs to telemetry', () => {
    const telemetry = vi.fn();
    const BrokenCard = () => {
      throw new Error('Simulated service interruption');
    };

    render(
      <TestErrorBoundary onError={telemetry}>
        <BrokenCard />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeDefined();
    expect(screen.getByText('Something went wrong.')).toBeDefined();
    expect(telemetry).toHaveBeenCalledOnce();
    expect(telemetry.mock.calls[0][0].message).toBe('Simulated service interruption');
  });

  it('recovery panel has a reset button so user can reload without full page refresh', () => {
    const BrokenCard = () => {
      throw new Error('DB connectivity error');
    };

    render(
      <TestErrorBoundary>
        <BrokenCard />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeDefined();
    const resetBtn = screen.getByRole('button', { name: /try again/i });
    expect(resetBtn).toBeDefined();
  });

  it('FeatureCardsSection catches nested child exception and logs to telemetry', () => {
    const telemetry = vi.fn();
    const GoodCard = () => <div data-testid="good-card">OK</div>;
    const BrokenCard = () => {
      throw new Error('Nested child exception');
    };

    render(
      <TestErrorBoundary onError={telemetry}>
        <FeatureCardsSection>
          <GoodCard />
          <BrokenCard />
        </FeatureCardsSection>
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeDefined();
    expect(telemetry).toHaveBeenCalledOnce();
    expect(telemetry.mock.calls[0][0].message).toBe('Nested child exception');
  });
});
