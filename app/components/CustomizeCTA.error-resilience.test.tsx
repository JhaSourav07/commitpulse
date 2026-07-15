import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { CustomizeCTA } from './CustomizeCTA';

let translationReturnsUndefined = false;

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (translationReturnsUndefined) return undefined;

      return key;
    },
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('CustomizeCTA Error Resilience', () => {
  beforeEach(() => {
    translationReturnsUndefined = false;
  });

  it('renders successfully during initial mount', () => {
    render(<CustomizeCTA />);

    expect(
      screen.getByRole('link', {
        name: /customize_cta\.btn/i,
      })
    ).toBeInTheDocument();
  });

  it('does not crash when translation service returns undefined', () => {
    translationReturnsUndefined = true;

    expect(() => render(<CustomizeCTA />)).not.toThrow();
  });

  it('renders the customize link even when translations are unavailable', () => {
    translationReturnsUndefined = true;

    render(<CustomizeCTA />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/customize');
  });

  it('renders correctly with mocked framer-motion wrapper', () => {
    render(<CustomizeCTA />);

    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('supports repeated renders without runtime exceptions', () => {
    const { rerender } = render(<CustomizeCTA />);

    rerender(<CustomizeCTA />);
    rerender(<CustomizeCTA />);

    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
