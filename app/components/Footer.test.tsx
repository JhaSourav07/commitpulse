import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders community text', () => {
    render(<Footer />);

    const text = screen.getByText(/Designed for the elite builder community/i);

    expect(text).toBeTruthy();
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

    const contributorsLink = screen.getByText(/Contributors/i);

    expect(contributorsLink).toBeTruthy();
  });
});
it('renders CommitPulse heading', () => {
  render(<Footer />);

  const heading = screen.getByText('CommitPulse');

  expect(heading).toBeTruthy();
});
it('renders Creator link', () => {
  render(<Footer />);

  const creatorLink = screen.getByText(/Creator/i);

  expect(creatorLink).toBeTruthy();
});
it('creator link points to GitHub profile', () => {
  render(<Footer />);

  const creatorLink = screen.getByText(/Creator/i);

  expect(creatorLink.closest('a')?.getAttribute('href')).toBe('https://github.com/jhasourav07');
});
it('renders copyright text', () => {
  render(<Footer />);

  expect(screen.getByText(/© 2026 CommitPulse. All rights reserved./i)).toBeTruthy();
});
