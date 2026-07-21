import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { CustomizeCTA } from './CustomizeCTA';

const tMock = vi.fn((key: string) => key);

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: tMock,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('CustomizeCTA mock integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with mocked services', () => {
    render(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.title')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/customize');
  });

  it('uses mocked translation provider', () => {
    render(<CustomizeCTA />);

    expect(tMock).toHaveBeenCalledWith('customize_cta.studio_badge');
    expect(tMock).toHaveBeenCalledWith('customize_cta.title');
    expect(tMock).toHaveBeenCalledWith('customize_cta.desc');
    expect(tMock).toHaveBeenCalledWith('customize_cta.btn');
  });

  it('renders without runtime exceptions when integrations are mocked', () => {
    expect(() => render(<CustomizeCTA />)).not.toThrow();
  });

  it('renders CTA using mocked Next.js Link integration', () => {
    render(<CustomizeCTA />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', '/customize');
    expect(link).toHaveAttribute('id', 'open-customization-studio-cta');
  });

  it('supports repeated renders with mocked integrations', () => {
    const { rerender } = render(<CustomizeCTA />);

    rerender(<CustomizeCTA />);
    rerender(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.title')).toBeInTheDocument();
  });
});
