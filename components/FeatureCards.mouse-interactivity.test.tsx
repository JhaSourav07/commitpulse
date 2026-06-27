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

describe('FeatureCards Mouse Interactivity', () => {
  it('renders content for hover interaction scenarios', () => {
    render(
      <FeatureCardsSection>
        <button>Hover Target</button>
      </FeatureCardsSection>
    );

    expect(screen.getByRole('button', { name: 'Hover Target' })).toBeInTheDocument();
  });

  it('renders content for tooltip interaction scenarios', () => {
    render(
      <FeatureCardsSection>
        <div>Tooltip Content</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Tooltip Content')).toBeInTheDocument();
  });

  it('renders content for click and touch interaction scenarios', () => {
    render(
      <FeatureCardsSection>
        <button>Touch Target</button>
      </FeatureCardsSection>
    );

    expect(screen.getByRole('button', { name: 'Touch Target' })).toBeInTheDocument();
  });

  it('renders content representing cursor interaction states', () => {
    render(
      <FeatureCardsSection>
        <div>Pointer Interaction</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Pointer Interaction')).toBeInTheDocument();
  });

  it('renders section heading correctly during interaction flows', () => {
    render(
      <FeatureCardsSection>
        <div>Interactive Content</div>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /why commitpulse/i,
      })
    ).toBeInTheDocument();
  });
});
