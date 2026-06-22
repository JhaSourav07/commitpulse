import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from './Footer';
import { useTranslation } from '@/context/TranslationContext';
import '@testing-library/jest-dom';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: vi.fn(),
}));

const mockT = vi.fn((path: string) => {
  const translations: Record<string, string> = {
    'footer.tagline': 'Track your open-source journey.',
    'footer.navigation': 'Navigation',
    'footer.resources': 'Resources',
    'footer.connect': 'Connect',
    'footer.home': 'Home',
    'footer.generator': 'Generator',
    'footer.compare': 'Compare',
    'footer.customization': 'Customization',
    'footer.contributors': 'Contributors',
    'footer.documentation': 'Documentation',
    'footer.github_repo': 'GitHub Repo',
    'footer.github': 'GitHub',
    'footer.creator_github': 'Creator GitHub',
    'footer.discord': 'Discord',
    'footer.twitter': 'Twitter',
    'footer.linkedin': 'LinkedIn',
    'footer.copyright': '© 2026 CommitPulse',
    'footer.made_with': 'Made with love',
  };
  return translations[path] || path;
});

describe('Footer Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: mockT,
      isPending: false,
    });
  });

  it('renders all four grid sections on mobile viewport', () => {
    render(<Footer />);

    expect(screen.getByText('CommitPulse')).toBeInTheDocument();
    expect(screen.getByText('Track your open-source journey.')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('renders navigation links with correct ARIA labels across viewports', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Generator' })).toHaveAttribute('href', '/generator');
    expect(screen.getByRole('link', { name: 'Contributors' })).toHaveAttribute(
      'href',
      '/contributors'
    );
  });

  it('renders external resource links with correct attributes', () => {
    render(<Footer />);

    const githubRepo = screen.getByText('GitHub Repo').closest('a');
    expect(githubRepo).toHaveAttribute('target', '_blank');
    expect(githubRepo).toHaveAttribute('rel', 'noopener noreferrer');

    const documentation = screen.getByText('Documentation').closest('a');
    expect(documentation).toHaveAttribute('target', '_blank');
  });

  it('applies responsive grid classes to the main container', () => {
    const { container } = render(<Footer />);

    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('applies responsive padding and layout classes to footer element', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer')!;
    expect(footer).toHaveClass('px-4');
    expect(footer).toHaveClass('sm:px-6');
    expect(footer).toHaveClass('md:py-12');
    expect(footer).toHaveClass('py-8');
  });

  it('renders copyright and made-with texts in the bottom section', () => {
    render(<Footer />);

    expect(screen.getByText('© 2026 CommitPulse')).toBeInTheDocument();
    expect(screen.getByText('Made with love')).toBeInTheDocument();
  });
});
