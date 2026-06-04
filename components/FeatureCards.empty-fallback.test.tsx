/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { FeatureCard, FeatureCardsSection } from './FeatureCards';

// Mock GSAP and ScrollTrigger
vi.mock('gsap', () => {
  const mockGsap = {
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    timeline: vi.fn().mockReturnValue({
      to: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }),
    context: vi.fn().mockImplementation((cb: any) => {
      cb();
      return { revert: vi.fn() };
    }),
    registerPlugin: vi.fn(),
  };
  return { default: mockGsap };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: vi.fn(),
}));

describe('FeatureCards - empty fallback', () => {
  const defaultProps = {
    icon: <span>Icon</span>,
    title: 'Fallback Title',
    desc: 'Fallback Desc',
    accent: 'bg-red-500',
    index: 0,
    accentColor: '#ff0000',
  };

  it('renders FeatureCard with default props', () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('Fallback Title')).toBeInTheDocument();
  });

  it('renders FeatureCard description safely', () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('Fallback Desc')).toBeInTheDocument();
  });

  it('renders FeatureCard icon correctly', () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('renders FeatureCardsSection empty fallback heading', () => {
    render(
      <FeatureCardsSection>
        <div>Child</div>
      </FeatureCardsSection>
    );
    expect(screen.getByText('Why CommitPulse?')).toBeInTheDocument();
  });

  it('renders FeatureCardsSection with children safely', () => {
    render(
      <FeatureCardsSection>
        <div>Child Node</div>
      </FeatureCardsSection>
    );
    expect(screen.getByText('Child Node')).toBeInTheDocument();
  });
});
