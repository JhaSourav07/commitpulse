import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer Massive Scaling', () => {
  it('renders successfully during repeated high-volume mounts', () => {
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<Footer />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      unmount();
    }
  });

  it('preserves all footer sections under scaling conditions', () => {
    render(<Footer />);

    expect(screen.getByRole('heading', { name: /Navigation/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Resources/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Connect/i })).toBeInTheDocument();
  });

  it('retains all navigation and social links at scale', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');

    expect(links.length).toBeGreaterThanOrEqual(11);
  });

  it('maintains responsive grid layout structure', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    const grid = footer.querySelector('.grid.grid-cols-2.md\\:grid-cols-2.lg\\:grid-cols-4');

    expect(grid).toBeInTheDocument();
  });

  it('keeps external links secure during large scale rendering', () => {
    render(<Footer />);

    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');

    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));

      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });
  });
});
