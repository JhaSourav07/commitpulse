import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'customize_cta.studio_badge': 'Customization Studio',
        'customize_cta.title': 'Create Your Perfect Profile',
        'customize_cta.desc': 'Customize your profile with advanced options.',
        'customize_cta.btn': 'Open Studio',
      };

      return translations[key] ?? key;
    },
  }),
}));

describe('CustomizeCTA massive scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders repeatedly without DOM instability', () => {
    for (let i = 0; i < 200; i++) {
      const { unmount } = render(<CustomizeCTA />);

      expect(screen.getByRole('heading')).toBeInTheDocument();

      unmount();
    }
  });

  it('preserves CTA structure when many instances are rendered', () => {
    const { container } = render(
      <>
        {Array.from({ length: 100 }).map((_, index) => (
          <CustomizeCTA key={index} />
        ))}
      </>
    );

    expect(container.querySelectorAll('#customization-studio').length).toBe(100);

    expect(container.querySelectorAll('a[href="/customize"]').length).toBe(100);
  });

  it('maintains acceptable render performance under repeated mount cycles', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<CustomizeCTA />);
      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('keeps navigation link functionality stable under repeated interactions', () => {
    render(<CustomizeCTA />);

    const link = screen.getByRole('link', {
      name: /open studio/i,
    });

    for (let i = 0; i < 100; i++) {
      fireEvent.click(link);
    }

    expect(link).toHaveAttribute('href', '/customize');
  });

  it('renders decorative visual elements consistently across many instances', () => {
    const { container } = render(
      <>
        {Array.from({ length: 50 }).map((_, index) => (
          <CustomizeCTA key={index} />
        ))}
      </>
    );

    const decorativeSvgs = container.querySelectorAll('svg[aria-hidden="true"]');

    expect(decorativeSvgs.length).toBe(50);

    const headings = screen.getAllByRole('heading');

    expect(headings.length).toBe(50);
  });
});
