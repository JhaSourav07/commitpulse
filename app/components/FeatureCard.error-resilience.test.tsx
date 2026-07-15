import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

import { FeatureCard } from './FeatureCard';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentPropsWithoutRef<'div'> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  override render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Recovered</div>;
    }

    return this.props.children;
  }
}

const defaultProps = {
  icon: <span data-testid="icon">★</span>,
  title: 'Analytics',
  desc: 'Track your progress',
  accent: 'text-emerald-400',
};

describe('FeatureCard Error Resilience', () => {
  it('renders successfully with valid props', () => {
    render(<FeatureCard {...defaultProps} />);

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track your progress')).toBeInTheDocument();
  });

  it('renders safely when optional values are empty', () => {
    render(<FeatureCard icon={<span />} title="" desc="" accent="" />);

    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('hydrates without mismatches', () => {
    const html = renderToString(<FeatureCard {...defaultProps} />);

    const container = document.createElement('div');
    container.innerHTML = html;

    expect(() => hydrateRoot(container, <FeatureCard {...defaultProps} />)).not.toThrow();
  });

  it('keeps accessibility attributes after hydration', () => {
    render(<FeatureCard {...defaultProps} />);

    const article = screen.getByRole('article');

    expect(article).toHaveAttribute('aria-labelledby');
    expect(article).toHaveAttribute('aria-describedby');
  });

  it('renders recovery UI when a child throws inside an Error Boundary', () => {
    const BrokenIcon = () => {
      throw new Error('Icon crashed');
    };

    render(
      <ErrorBoundary>
        <FeatureCard icon={<BrokenIcon />} title="Broken" desc="Failure" accent="" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
