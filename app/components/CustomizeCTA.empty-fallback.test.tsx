import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockT = vi.fn();

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import { CustomizeCTA } from './CustomizeCTA';

describe('CustomizeCTA empty fallback coverage', () => {
  it('renders without crashing when all translations are empty strings', () => {
    mockT.mockReturnValue('');

    render(<CustomizeCTA />);

    expect(document.getElementById('open-customization-studio-cta')).toBeInTheDocument();
  });

  it('renders fallback structure when translation keys return undefined', () => {
    mockT.mockReturnValue(undefined);

    render(<CustomizeCTA />);

    expect(document.getElementById('customization-studio')).toBeInTheDocument();

    expect(document.getElementById('open-customization-studio-cta')).toBeInTheDocument();
  });

  it('requests all required translation keys', () => {
    mockT.mockImplementation((key: string) => key);

    render(<CustomizeCTA />);

    expect(mockT).toHaveBeenCalledWith('customize_cta.studio_badge');
    expect(mockT).toHaveBeenCalledWith('customize_cta.title');
    expect(mockT).toHaveBeenCalledWith('customize_cta.desc');
    expect(mockT).toHaveBeenCalledWith('customize_cta.btn');
  });

  it('keeps customize link available with missing content', () => {
    mockT.mockReturnValue('');

    render(<CustomizeCTA />);

    const cta = document.getElementById('open-customization-studio-cta');

    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/customize');
  });

  it('renders CTA button even when translations are null-like', () => {
    mockT.mockImplementation(() => null as unknown as string);

    render(<CustomizeCTA />);

    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
