import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer - real component coverage (CI-safe)', () => {
  it('renders branding correctly', () => {
    render(<Footer />);
    expect(screen.getByText('CommitPulse')).toBeInTheDocument();
  });

  it('renders footer description', () => {
    render(<Footer />);
    expect(screen.getByText('Designed for the elite builder community.')).toBeInTheDocument();
  });

  it('renders navigation links correctly', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Generator' })).toHaveAttribute('href', '/generator');
    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
    expect(screen.getByRole('link', { name: 'Customization' })).toHaveAttribute(
      'href',
      '/customize'
    );
  });

  it('renders GitHub repository links correctly', () => {
    render(<Footer />);

    const repoLink = screen.getByRole('link', { name: 'GitHub Repository' });
    expect(repoLink).toHaveAttribute('href', expect.stringContaining('github.com'));
  });

  it('renders social links using aria-labels (no ambiguity)', () => {
    render(<Footer />);

    // Social links now appear twice: once in the Connect column and once in the bottom bar icon strip.
    const githubLinks = screen.getAllByRole('link', { name: 'CommitPulse on GitHub' });
    expect(githubLinks.length).toBeGreaterThanOrEqual(1);
    expect(githubLinks[0]).toHaveAttribute('href', expect.stringContaining('github.com'));

    expect(screen.getByRole('link', { name: 'Creator Sourav Jha on GitHub' })).toHaveAttribute(
      'href',
      expect.stringContaining('github.com')
    );

    const discordLinks = screen.getAllByRole('link', { name: 'Join CommitPulse on Discord' });
    expect(discordLinks.length).toBeGreaterThanOrEqual(1);
    expect(discordLinks[0]).toHaveAttribute('href', expect.stringContaining('discord'));
  });
});
