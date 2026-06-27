import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RootLayout from './layout';

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="mock-analytics" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="mock-navbar" />,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="mock-brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <div data-testid="mock-return-to-top" />,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="mock-scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="mock-animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="mock-konami-easter-egg" />,
}));

describe('Layout - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders thousands of child elements without layout breakage', () => {
    const massiveChildren = Array.from({ length: 5000 }, (_, i) => (
      <div key={i}>Contributor {i}</div>
    ));
    render(<RootLayout>{massiveChildren}</RootLayout>);

    expect(screen.getByText('Contributor 0')).toBeInTheDocument();
    expect(screen.getByText('Contributor 4999')).toBeInTheDocument();
  });

  it('handles extremely large text content without crashing', () => {
    const hugeText = 'A'.repeat(100000);
    render(
      <RootLayout>
        <div>{hugeText}</div>
      </RootLayout>
    );
    expect(screen.getByText(hugeText)).toBeInTheDocument();
  });

  it('renders all layout shell components under massive child load', () => {
    const massiveChildren = Array.from({ length: 2000 }, (_, i) => <p key={i}>Activity log {i}</p>);
    render(<RootLayout>{massiveChildren}</RootLayout>);

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
    expect(screen.getByTestId('mock-return-to-top')).toBeInTheDocument();
  });

  it('renders nested large structures correctly without overflow', () => {
    const nestedContent = Array.from({ length: 1000 }, (_, i) => (
      <div key={i}>
        <span>User {i}</span>
      </div>
    ));
    render(<RootLayout>{nestedContent}</RootLayout>);

    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 999')).toBeInTheDocument();
  });

  it('renders without crashing under extreme load of 10000 elements', () => {
    const extremeContent = Array.from({ length: 10000 }, (_, i) => <div key={i}>Record {i}</div>);
    expect(() => {
      render(<RootLayout>{extremeContent}</RootLayout>);
    }).not.toThrow();
  });
});
