import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomizeCTA } from './CustomizeCTA';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('CustomizeCTA Theme Contrast', () => {
  it('applies light and dark background classes to the CTA card', () => {
    const { container } = render(<CustomizeCTA />);

    const card = container.querySelector('.bg-white.dark\\:bg-\\[\\#0a0a0a\\]');

    expect(card).toBeTruthy();
  });

  it('applies light and dark text classes to the heading', () => {
    render(<CustomizeCTA />);

    const heading = screen.getByRole('heading', { level: 2 });

    expect(heading.className).toContain('text-black');
    expect(heading.className).toContain('dark:text-white');
  });

  it('applies theme-aware styling to the badge label', () => {
    render(<CustomizeCTA />);

    const badge = screen.getByText('Customization Studio');

    expect(badge.className).toContain('text-emerald-600');
    expect(badge.className).toContain('dark:text-emerald-400');
  });

  it('applies theme-aware border styling to the CTA card', () => {
    const { container } = render(<CustomizeCTA />);

    const card = container.querySelector('.border-black\\/10.dark\\:border-white\\/5');

    expect(card).toBeTruthy();
  });

  it('applies contrasting button colors for visibility in both themes', () => {
    const { container } = render(<CustomizeCTA />);

    const button = container.querySelector('#open-customization-studio-cta span');

    expect(button?.className).toContain('bg-gray-100');
    expect(button?.className).toContain('dark:bg-white');
    expect(button?.className).toContain('text-black');
    expect(button?.className).toContain('dark:text-black');
  });
});
