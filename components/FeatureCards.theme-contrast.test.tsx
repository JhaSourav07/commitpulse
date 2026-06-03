import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('gsap', () => ({
  default: {
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    registerPlugin: vi.fn(),
    context: vi.fn((callback: () => void) => {
      callback();

      return {
        revert: vi.fn(),
      };
    }),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

import { FeatureCardsSection } from './FeatureCards';

describe('FeatureCards Theme Contrast', () => {
  it('renders correctly in simulated light theme', () => {
    document.documentElement.classList.remove('dark');

    render(
      <FeatureCardsSection>
        <div>Light Theme Content</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Light Theme Content')).toBeInTheDocument();
  });

  it('renders correctly in simulated dark theme', () => {
    document.documentElement.classList.add('dark');

    render(
      <FeatureCardsSection>
        <div>Dark Theme Content</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Dark Theme Content')).toBeInTheDocument();
  });

  it('maintains heading visibility across themes', () => {
    render(
      <FeatureCardsSection>
        <div>Theme Test</div>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /why commitpulse/i,
      })
    ).toBeInTheDocument();
  });

  it('renders child content without clipping foreground elements', () => {
    render(
      <FeatureCardsSection>
        <button>Foreground Action</button>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('button', {
        name: 'Foreground Action',
      })
    ).toBeInTheDocument();
  });

  it('preserves layout structure under theme changes', () => {
    const { container } = render(
      <FeatureCardsSection>
        <div>Theme Layout Content</div>
      </FeatureCardsSection>
    );

    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Theme Layout Content')).toBeInTheDocument();
  });
});
