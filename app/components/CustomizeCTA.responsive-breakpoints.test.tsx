import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { CustomizeCTA } from './CustomizeCTA';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('CustomizeCTA responsive breakpoints', () => {
  it('renders successfully', () => {
    render(<CustomizeCTA />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('uses responsive flex layout classes', () => {
    const { container } = render(<CustomizeCTA />);

    expect(container.querySelector('.flex-col')).toBeInTheDocument();
    expect(container.querySelector('.md\\:flex-row')).toBeInTheDocument();
  });

  it('uses responsive heading typography', () => {
    render(<CustomizeCTA />);

    const heading = screen.getByRole('heading', { level: 2 });

    expect(heading).toHaveClass('text-2xl');
    expect(heading).toHaveClass('md:text-3xl');
  });

  it('keeps CTA link accessible on all layouts', () => {
    render(<CustomizeCTA />);

    expect(
      screen.getByRole('link', {
        name: /customize_cta\.btn/i,
      })
    ).toHaveAttribute('href', '/customize');
  });

  it('applies responsive spacing utilities', () => {
    const { container } = render(<CustomizeCTA />);

    expect(container.querySelector('.gap-8')).toBeInTheDocument();
    expect(container.querySelector('.px-8')).toBeInTheDocument();
    expect(container.querySelector('.py-10')).toBeInTheDocument();
  });
});
