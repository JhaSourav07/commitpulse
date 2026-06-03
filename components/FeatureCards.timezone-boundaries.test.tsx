// components/FeatureCards.timezone-boundaries.test.tsx

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

describe('FeatureCards Timezone Boundaries', () => {
  it('renders successfully with UTC boundary content', () => {
    render(
      <FeatureCardsSection>
        <div>UTC Activity Data</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('UTC Activity Data')).toBeInTheDocument();
  });

  it('renders successfully with EST and IST boundary content', () => {
    render(
      <FeatureCardsSection>
        <div>EST to IST Transition</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('EST to IST Transition')).toBeInTheDocument();
  });

  it('renders successfully with leap year references', () => {
    render(
      <FeatureCardsSection>
        <div>February 29 2024</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('February 29 2024')).toBeInTheDocument();
  });

  it('renders successfully with daylight savings references', () => {
    render(
      <FeatureCardsSection>
        <div>DST Transition Date</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('DST Transition Date')).toBeInTheDocument();
  });

  it('renders section heading correctly', () => {
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
});
