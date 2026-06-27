import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomizeCTA } from './CustomizeCTA';

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

describe('CustomizeCTA Accessibility', () => {
  it('renders the primary heading for screen readers', () => {
    render(<CustomizeCTA />);

    expect(
      screen.getByRole('heading', {
        name: /create your perfect profile/i,
      })
    ).toBeInTheDocument();
  });

  it('renders an accessible navigation link to customization studio', () => {
    render(<CustomizeCTA />);

    expect(
      screen.getByRole('link', {
        name: /open studio/i,
      })
    ).toBeInTheDocument();
  });

  it('preserves keyboard-focusable interactive elements', () => {
    render(<CustomizeCTA />);

    const link = screen.getByRole('link', {
      name: /open studio/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/customize');
  });

  it('renders descriptive content for assistive technologies', () => {
    render(<CustomizeCTA />);

    expect(screen.getByText(/customize your profile with advanced options/i)).toBeInTheDocument();
  });

  it('maintains logical heading hierarchy and decorative accessibility rules', () => {
    render(<CustomizeCTA />);

    const heading = screen.getByRole('heading', {
      name: /create your perfect profile/i,
    });

    expect(heading.tagName).toBe('H2');

    const decorativeSvgs = document.querySelectorAll('svg[aria-hidden="true"]');

    expect(decorativeSvgs.length).toBeGreaterThan(0);
  });
});
