import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RootLayout, { metadata } from './layout';

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mock-inter-font',
  }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <button data-testid="return-to-top">Top</button>,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="konami-easter-egg" />,
}));

describe('RootLayout empty fallback', () => {
  it('renders without crashing when children are empty', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(screen.getByTestId('providers')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('keeps the main content landmark available for empty children', () => {
    render(<RootLayout>{null}</RootLayout>);

    const main = screen.getByRole('main');

    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveClass('relative');
    expect(main).toHaveClass('z-10');
    expect(main).toBeEmptyDOMElement();
  });

  it('renders skip link fallback structure before app content', () => {
    render(<RootLayout>{null}</RootLayout>);

    const skipLink = screen.getByText('Skip to main content');

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('sr-only');
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });

  it('renders required layout wrappers with missing page content', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(screen.getByTestId('scroll-restoration')).toBeInTheDocument();
    expect(screen.getByTestId('animated-cursor')).toBeInTheDocument();
    expect(screen.getByTestId('brand-particles')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('return-to-top')).toBeInTheDocument();
    expect(screen.getByTestId('konami-easter-egg')).toBeInTheDocument();
    expect(screen.getByTestId('analytics')).toBeInTheDocument();
  });

  it('exports stable fallback metadata for empty layout rendering', () => {
    expect(metadata.title).toBe('CommitPulse | 3D Isometric GitHub Contribution Graph');
    expect(metadata.description).toContain('GitHub contribution history');
    expect(metadata.openGraph?.title).toBe('CommitPulse | 3D Isometric GitHub Contribution Graph');
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });
});
