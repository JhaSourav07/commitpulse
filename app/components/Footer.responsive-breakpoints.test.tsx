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

  it('stacks navigation, resources, and connect sections into vertical flex lists on mobile', () => {
    const { container } = render(<Footer />);

    const flexColContainers = container.querySelectorAll('.flex.flex-col');
    expect(flexColContainers.length).toBeGreaterThanOrEqual(8);

    const navList = container.querySelector('nav.flex.flex-col.gap-2');
    expect(navList).toBeInTheDocument();

    const headings = ['Navigation', 'Resources', 'Connect'];
    headings.forEach((label) => {
      const heading = screen.getByText(label);
      const sectionWrapper = heading.closest('.flex.flex-col.items-center.sm\\:items-start');
      expect(sectionWrapper).toBeInTheDocument();
    });
  });

  it('does not use fixed pixel widths that could cause horizontal overflow at 375px', () => {
    const { container } = render(<Footer />);

    const allEls = container.querySelectorAll('[class]');
    allEls.forEach((el) => {
      const classes = el.getAttribute('class') || '';
      expect(classes).not.toMatch(/\bw-\[\d+px\]/);
      expect(classes).not.toMatch(/\bmin-w-\[\d+px\]/);
    });

    const wrapper = container.querySelector('.mx-auto.max-w-6xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders icons with shrink-0 so they scale gracefully instead of distorting on narrow screens', () => {
    const { container } = render(<Footer />);

    const shrinkIcons = container.querySelectorAll('svg[class*="shrink-0"]');
    expect(shrinkIcons.length).toBeGreaterThan(0);
  });

  it('centers section headings/links on narrow viewports before left-aligning at the sm breakpoint', () => {
    const { container } = render(<Footer />);

    const centeredSections = container.querySelectorAll('.items-center.sm\\:items-start');
    expect(centeredSections.length).toBe(3);
  });
});
