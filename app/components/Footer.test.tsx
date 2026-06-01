import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders community text', () => {
    render(<Footer />);

    expect(screen.getByText(/Designed for the elite builder community/i)).toBeInTheDocument();
  });

  it('renders Documentation link with the correct destination', () => {
    render(<Footer />);

    const documentationLink = screen.getByRole('link', {
      name: /Documentation/i,
    });

    expect(documentationLink).toHaveAttribute(
      'href',
      'https://github.com/JhaSourav07/commitpulse/blob/main/README.md'
    );
  });

  it('opens Documentation link in a new tab securely', () => {
    render(<Footer />);

    const documentationLink = screen.getByRole('link', {
      name: /Documentation/i,
    });

    expect(documentationLink).toHaveAttribute('target', '_blank');
    expect(documentationLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(documentationLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders Contributors link', () => {
    render(<Footer />);

    expect(
      screen.getByRole('link', {
        name: /Contributors/i,
      })
    ).toBeInTheDocument();
  });

  it('exposes the footer as a semantic contentinfo landmark for screen readers', () => {
    render(<Footer />);

    // A semantic <footer> is exposed to assistive technology as the contentinfo landmark.
    const footer = screen.getByRole('contentinfo');

    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
  });

  it('includes responsive layout classes for mobile and desktop breakpoints', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');

    // JSDOM cannot calculate Tailwind media queries, so this verifies the actual
    // responsive utility classes that switch the footer layout at the md breakpoint.
    const responsiveLayout = footer.querySelector('.flex.flex-col.md\\:flex-row.md\\:items-start');

    expect(responsiveLayout).toBeInTheDocument();
    expect(responsiveLayout).toHaveClass(
      'mx-auto',
      'flex',
      'max-w-6xl',
      'flex-col',
      'items-center',
      'justify-between',
      'gap-6',
      'text-sm',
      'md:flex-row',
      'md:items-start',
      'md:gap-0'
    );
  });
});
