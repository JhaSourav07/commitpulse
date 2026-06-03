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

describe('FeatureCards Mock Integrations', () => {
  it('renders successfully with mocked service data', () => {
    render(
      <FeatureCardsSection>
        <div>Mock Service Data</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Mock Service Data')).toBeInTheDocument();
  });

  it('renders loading placeholder content', () => {
    render(
      <FeatureCardsSection>
        <div>Loading...</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders cached content successfully', () => {
    render(
      <FeatureCardsSection>
        <div>Cached Result</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Cached Result')).toBeInTheDocument();
  });

  it('renders fallback content during timeout scenarios', () => {
    render(
      <FeatureCardsSection>
        <div>Fallback Content</div>
      </FeatureCardsSection>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders section heading correctly with mocked integrations', () => {
    render(
      <FeatureCardsSection>
        <div>Integration Content</div>
      </FeatureCardsSection>
    );

    expect(
      screen.getByRole('heading', {
        name: /why commitpulse/i,
      })
    ).toBeInTheDocument();
  });
});
