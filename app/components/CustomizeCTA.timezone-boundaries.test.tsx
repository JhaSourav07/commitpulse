import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustomizeCTA } from './CustomizeCTA';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.PropsWithChildren<{ href: string }>) => (
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

afterEach(() => {
  cleanup();
});

describe('CustomizeCTA timezone boundaries', () => {
  const timezones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Asia/Tokyo'];

  it.each(timezones)('renders identical core UI in %s timezone', (timezone) => {
    process.env.TZ = timezone;

    render(<CustomizeCTA />);

    expect(screen.getByText('customize_cta.studio_badge')).toBeInTheDocument();

    expect(screen.getByText('customize_cta.title')).toBeInTheDocument();

    expect(screen.getByText('customize_cta.desc')).toBeInTheDocument();

    expect(screen.getByText('customize_cta.btn')).toBeInTheDocument();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/customize');

    cleanup();
  });
});
