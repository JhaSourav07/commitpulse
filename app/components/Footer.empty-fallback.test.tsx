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

    // Check that sections render raw keys
    expect(screen.getByText('footer.tagline')).toBeInTheDocument();
    expect(screen.getByText('footer.navigation')).toBeInTheDocument();
    expect(screen.getByText('footer.resources')).toBeInTheDocument();
    expect(screen.getByText('footer.connect')).toBeInTheDocument();

    // Check navigation links contain path strings
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

    // Verify it doesn't crash and layout spans/links are rendered but empty
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.textContent).toBe('');
    });
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

    expect(screen.getByText('Copyright CommitPulse')).toBeInTheDocument();
  });

  it('handles custom LinkComponent renders safely with missing optional params', () => {
    // Optional params like ariaLabel are undefined/missing for navigation links.
    // We mock useTranslation to return specific values.
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

    // Internal Link Component with missing parameters
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).not.toHaveAttribute('aria-label'); // undefined ariaLabel
    expect(homeLink).not.toHaveAttribute('target'); // not external

    // External Link Component
    const githubLink = screen.getByRole('link', { name: 'CommitPulse on GitHub' });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders correct current year when system date environment changes', () => {
    const mockT = vi.fn().mockImplementation((path: string, params?: Record<string, string>) => {
      if (path === 'footer.copyright' && params) {
        return `© ${params.year} CommitPulse`;
      }
      return path;
    });

    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: mockT,
      isPending: false,
    });

    const currentYear = new Date().getFullYear().toString();
    render(<Footer />);

    expect(screen.getByText(`© ${currentYear} CommitPulse`)).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('footer.copyright', { year: currentYear });
  });
});
