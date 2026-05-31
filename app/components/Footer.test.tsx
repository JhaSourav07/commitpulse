import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders community text', () => {
    render(<Footer />);

    expect(screen.getByText(/Designed for the elite builder community/i)).toBeTruthy();
  });

  it('renders Documentation link', () => {
    render(<Footer />);

    const docLink = screen.getByText(/Documentation/i);

    expect(docLink).toBeTruthy();

    expect(docLink.closest('a')?.getAttribute('href')).toBe(
      'https://github.com/JhaSourav07/commitpulse/blob/main/README.md'
    );
  });

  it('opens documentation in new tab', () => {
    render(<Footer />);

    const docLink = screen.getByText(/Documentation/i);

    expect(docLink.closest('a')?.getAttribute('target')).toBe('_blank');
  });

  it('renders Contributors link', () => {
    render(<Footer />);

    expect(screen.getByText(/Contributors/i)).toBeTruthy();
  });

  it('renders Creator link', () => {
    render(<Footer />);

    const creatorLink = screen.getByText(/Creator/i);

    expect(creatorLink.closest('a')?.getAttribute('href')).toBe('https://github.com/jhasourav07');
  });

  it('renders footer landmark for accessibility', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('renders copyright text', () => {
    render(<Footer />);

    expect(screen.getByText(/© 2026 CommitPulse. All rights reserved./i)).toBeTruthy();
  });
});

describe('Footer Responsive Layout', () => {
  it('contains responsive classes for mobile and desktop layouts', () => {
    const { container } = render(<Footer />);

    const layoutContainer = container.querySelector('.mx-auto');

    expect(layoutContainer).toBeTruthy();
    expect(layoutContainer?.className).toContain('flex-col');
    expect(layoutContainer?.className).toContain('md:flex-row');
  });

  it('contains responsive text alignment classes', () => {
    render(<Footer />);

    const heading = screen.getByText('CommitPulse');

    expect(heading.parentElement?.className).toContain('md:text-left');
  });
});
