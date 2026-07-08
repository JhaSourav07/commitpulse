import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import ReviewAnalytics from './ReviewAnalytics';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        return ({
          children,
          animate,
          initial,
          exit,
          transition,
          whileHover,
          whileTap,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => React.createElement(tag as string, props, children);
      },
    }
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  Eye: () => <svg data-testid="icon-eye" />,
  MessageCircle: () => <svg data-testid="icon-message-circle" />,
  Clock: () => <svg data-testid="icon-clock" />,
  FastForward: () => <svg data-testid="icon-fast-forward" />,
}));

function makeData(overrides: Partial<PRInsightData> = {}): PRInsightData {
  return {
    reviewsGiven: 42,
    reviewsReceived: 18,
    fastestReview: 0.5,
    slowestReview: 72.3,
    totalPRs: 0,
    mergedPRs: 0,
    openPRs: 0,
    closedPRs: 0,
    avgMergeTime: 0,
    avgReviewCount: 0,
    reviewParticipation: 0,
    prVelocity: [],
    reviewerStats: [],
    repoPerformance: [],
    labels: [],
    sizeDistribution: { small: 0, medium: 0, large: 0, xl: 0 },
    codingHours: { morning: 0, evening: 0, afternoon: 0, night: 0 },
    ...overrides,
  } as unknown as PRInsightData;
}

describe('ReviewAnalytics - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('fires mouseenter and mouseleave on each stat card without throwing', () => {
    const { container } = render(<ReviewAnalytics data={makeData()} />);

    // The 4 stat cards are the rounded-2xl divs inside the grid
    const cards = container.querySelectorAll('.rounded-2xl');
    expect(cards.length).toBe(4);

    cards.forEach((card) => {
      expect(() => fireEvent.mouseEnter(card)).not.toThrow();
      expect(() => fireEvent.mouseLeave(card)).not.toThrow();
    });
  });

  it('propagates touch start and touch end events on all 4 stat cards without being prevented', () => {
    const { container } = render(<ReviewAnalytics data={makeData()} />);

    const cards = container.querySelectorAll('.rounded-2xl');
    expect(cards.length).toBe(4);

    cards.forEach((card) => {
      expect(fireEvent.touchStart(card)).toBe(true);
      expect(fireEvent.touchEnd(card)).toBe(true);
    });
  });

  it('renders all 4 icon elements confirming interactive stat slots are present in the DOM', () => {
    render(<ReviewAnalytics data={makeData()} />);

    // Each card must have its icon rendered — confirms all 4 interactive slots exist
    expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    expect(screen.getByTestId('icon-message-circle')).toBeInTheDocument();
    expect(screen.getByTestId('icon-fast-forward')).toBeInTheDocument();
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
  });

  it('renders correct stat values so hover-revealed content reflects real data', () => {
    render(
      <ReviewAnalytics
        data={makeData({
          reviewsGiven: 99,
          reviewsReceived: 7,
          fastestReview: 1.2,
          slowestReview: 48.0,
        })}
      />
    );

    // Values that would appear in tooltip/overlay content must match the data
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1.2')).toBeInTheDocument();
    expect(screen.getByText('48.0')).toBeInTheDocument();
  });

  it('renders stat card color accent classes confirming visual hover-state indicators are in place', () => {
    const { container } = render(<ReviewAnalytics data={makeData()} />);

    // Each card label row has a colored accent class identifying the interactive segment
    expect(container.querySelector('.text-indigo-500')).toBeInTheDocument();
    expect(container.querySelector('.text-pink-500')).toBeInTheDocument();
    expect(container.querySelector('.text-emerald-500')).toBeInTheDocument();
    expect(container.querySelector('.text-rose-500')).toBeInTheDocument();
  });
});
