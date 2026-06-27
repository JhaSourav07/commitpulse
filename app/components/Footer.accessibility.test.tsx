import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { Footer } from './Footer';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'aria-label'?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe('Footer — Accessibility & Screen Reader Compliance', () => {
  it('renders footer landmark with correct heading hierarchy', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'CommitPulse' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Resources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Connect' })).toBeInTheDocument();
  });

  it('renders navigation landmarks for keyboard and screen reader navigation', () => {
    render(<Footer />);

    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders social links with descriptive aria-labels for screen readers', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'CommitPulse on GitHub' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Creator Sourav Jha on GitHub' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Join CommitPulse on Discord' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Creator on X' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Creator on LinkedIn' })).toBeInTheDocument();
  });

  it('applies visible focus ring classes to all interactive links', () => {
    const { container } = render(<Footer />);

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('focus:ring-2');
    });
  });

  it('sets target="_blank" and rel="noopener noreferrer" on all external links', () => {
    render(<Footer />);

    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');

    expect(externalLinks.length).toBeGreaterThan(0);

    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
