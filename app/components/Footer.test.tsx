import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';

// Mock translation context to prevent key fallbacks from breaking standard test assertions
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'footer.home': 'Home',
        'footer.generator': 'Generator',
        'footer.compare': 'Compare',
        'footer.customization': 'Customization',
        'footer.contributors': 'Contributors',
        'footer.documentation': 'Documentation',
        'footer.github_repo': 'GitHub Repository',
        'footer.navigation': 'Navigation',
        'footer.resources': 'Resources',
        'footer.connect': 'Connect',
      };
      return keys[key] || key;
    },
  }),
}));

describe('Footer Component', () => {
  it('renders community text', () => {
    render(<Footer />);
    expect(screen.getByText(/Designed for the elite builder community/i)).toBeInTheDocument();
  });

  it('renders Documentation link with the correct destination', () => {
    render(<Footer />);
    const documentationLink = screen.getByRole('link', { name: /Documentation/i });
    expect(documentationLink).toHaveAttribute(
      'href',
      'https://github.com/JhaSourav07/commitpulse/blob/main/README.md'
    );
  });

  it('opens Documentation link in a new tab securely', () => {
    render(<Footer />);
    const documentationLink = screen.getByRole('link', { name: /Documentation/i });
    expect(documentationLink).toHaveAttribute('target', '_blank');
    expect(documentationLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(documentationLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders Contributors link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /Contributors/i })).toBeInTheDocument();
  });

  it('renders Creator link to creator GitHub profile', () => {
    render(<Footer />);
    const creatorLink = screen.getByRole('link', { name: /Creator Sourav Jha on GitHub/i });
    expect(creatorLink).toHaveAttribute('href', 'https://github.com/jhasourav07');
  });

  it('renders Discord community link', () => {
    render(<Footer />);



    const discordLink = screen.getByRole('link', {
      name: /Discord/i,
    });

    expect(discordLink).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');

  });

  it('exposes the footer as a semantic contentinfo landmark for screen readers', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
  });

  it('includes Navigation section with all navigation links', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Compare/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Customization/i })).toBeInTheDocument();
  });

  it('includes Resources section with documentation and repository links', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Resources/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub Repository/i })).toBeInTheDocument();
  });

  it('includes Connect section with social media links', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Connect/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Creator on X/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Creator on LinkedIn/i })).toBeInTheDocument();
  });

  it('has proper responsive layout classes', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    const mainContent = footer.querySelector(
      '.grid.grid-cols-2.gap-6.md\\:grid-cols-2.lg\\:grid-cols-4'
    );
    expect(mainContent).toBeInTheDocument();
  });

  it('includes copyright year in the footer', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear} CommitPulse`))).toBeInTheDocument();
  });

  it('renders all external links with proper security attributes', () => {
    render(<Footer />);
    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
  });

  it('includes focus visible states for keyboard accessibility', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    const links = footer.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('focus:outline-none');
      expect(link.className).toContain('focus:ring');
    });
  });
});
