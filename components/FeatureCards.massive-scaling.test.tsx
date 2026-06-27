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

describe('FeatureCards - massive scaling', () => {
  const scaleProps = {
    icon: <span>Scale</span>,
    title: 'Massive Scale Title',
    desc: 'Massive Scale Desc',
    accent: 'bg-blue-500',
    index: 9999,
    accentColor: '#0000ff',
  };

  it('renders FeatureCard at scale', () => {
    render(<FeatureCard {...scaleProps} />);
    expect(screen.getByText('Massive Scale Title')).toBeInTheDocument();
  });

  it('renders FeatureCard massive desc', () => {
    render(<FeatureCard {...scaleProps} />);
    expect(screen.getByText('Massive Scale Desc')).toBeInTheDocument();
  });

  it('renders FeatureCard massive icon', () => {
    render(<FeatureCard {...scaleProps} />);
    expect(screen.getByText('Scale')).toBeInTheDocument();
  });

  it('renders FeatureCardsSection scaling heading', () => {
    render(
      <FeatureCardsSection>
        <div>Scale Child</div>
      </FeatureCardsSection>
    );
    expect(screen.getByText('Why CommitPulse?')).toBeInTheDocument();
  });

  it('renders FeatureCardsSection massive children safely', () => {
    render(
      <FeatureCardsSection>
        <div>Massive Node</div>
      </FeatureCardsSection>
    );
    expect(screen.getByText('Massive Node')).toBeInTheDocument();
  });
});
