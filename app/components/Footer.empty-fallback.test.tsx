import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from './Footer';
import { useTranslation } from '@/context/TranslationContext';
import '@testing-library/jest-dom';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: vi.fn(),
}));

describe('Footer empty-fallback and edge-cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders raw translation keys as fallback when t returns the path keys', () => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (path: string) => path,
      isPending: false,
    });

    render(<Footer />);

    // Your overhaul hardcodes the brand subtitle text, so we check formatting headers & structure
    expect(screen.getByText('footer.navigation')).toBeInTheDocument();
    expect(screen.getByText('footer.resources')).toBeInTheDocument();
    expect(screen.getByText('footer.connect')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'footer.home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'footer.contributors' })).toBeInTheDocument();
  });

  it('renders blank slots without crashing when translation strings are empty', () => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: () => '',
      isPending: false,
    });

    const { container } = render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('handles copyright string safely when year parameter is missing or ignored by t', () => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (path: string) => {
        if (path === 'footer.copyright') {
          return 'Copyright CommitPulse';
        }
        return path;
      },
      isPending: false,
    });

    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear} CommitPulse`))).toBeInTheDocument();
  });

  it('handles custom LinkComponent renders safely with missing optional params', () => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (path: string) => {
        if (path === 'footer.home') return 'Home';
        if (path === 'footer.github') return 'GitHub';
        return '';
      },
      isPending: false,
    });

    render(<Footer />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).not.toHaveAttribute('aria-label');
    expect(homeLink).not.toHaveAttribute('target');

    const githubLink = screen.getByRole('link', { name: 'CommitPulse on GitHub' });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders correct current year when system date environment changes', () => {
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (path: string) => path,
      isPending: false,
    });

    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear} CommitPulse`))).toBeInTheDocument();
  });
});
