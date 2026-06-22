import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter-font',
  }),
}));

import RootLayout, { metadata, viewport } from './layout';

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <button>Return To Top</button>,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="konami" />,
}));

describe('Layout Edge Cases & Empty/Missing Inputs Verification', () => {
  it('renders layout successfully with empty children', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('renders fallback main container even without content', () => {
    render(<RootLayout>{undefined}</RootLayout>);

    expect(document.querySelector('main')).toBeInTheDocument();
    expect(document.querySelector('#main-content')).toBeInTheDocument();
  });

  it('preserves standard layout structure during empty states', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(document.querySelector('body')).toBeInTheDocument();
    expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
  });

  it('maintains accessibility skip link in empty layout state', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
  });

  it('exports stable metadata and viewport defaults', () => {
    expect(metadata.title).toContain('CommitPulse');

    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
    ]);
  });
});
