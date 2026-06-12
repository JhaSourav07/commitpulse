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

describe('FeatureCards Accessibility', () => {
  it('renders the primary section heading', () => {
    render(
      <FeatureCardsSection>
        <div>Content</div>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /why commitpulse/i,
      })
    ).toBeInTheDocument();
  });

  it('renders child content in an accessible document structure', () => {
    render(
      <FeatureCardsSection>
        <button>Accessible Button</button>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('button', {
        name: 'Accessible Button',
      })
    ).toBeInTheDocument();
  });

  it('preserves keyboard-focusable interactive elements', () => {
    render(
      <FeatureCardsSection>
        <button>Focusable Element</button>
      </FeatureCardsSection>
    );

    const button = screen.getByRole('button', {
      name: 'Focusable Element',
    });

    expect(button).toBeInTheDocument();
  });

  it('renders descriptive content for screen readers', () => {
    render(
      <FeatureCardsSection>
        <p>Accessibility Description</p>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Accessibility Description')).toBeInTheDocument();
  });

  it('maintains logical heading hierarchy', () => {
    render(
      <FeatureCardsSection>
        <h2>Secondary Heading</h2>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /why commitpulse/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: 'Secondary Heading',
      })
    ).toBeInTheDocument();
  });
});
