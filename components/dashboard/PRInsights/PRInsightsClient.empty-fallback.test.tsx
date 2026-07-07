import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PRInsightsClient from './PRInsightsClient';
import type { PRInsightData } from '@/services/github/pr-insights';
import '@testing-library/jest-dom/vitest';

// Types for framer-motion mock
interface MockMotionProps extends React.HTMLAttributes<HTMLElement> {
  animate?: unknown;
  transition?: unknown;
}

// Mock framer-motion to render normal HTML tags and avoid animation complications
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        void _target;
        const motionComponent = React.forwardRef<HTMLElement, MockMotionProps>(
          ({ children, animate: _animate, transition: _transition, ...props }, ref) => {
            void _animate;
            void _transition;
            return React.createElement(tag, { ref, ...props }, children);
          }
        );
        motionComponent.displayName = `Motion${tag}`;
        return motionComponent;
      },
    }
  ),
}));

// Mock recharts
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const emptyInsights: PRInsightData = {
  totalPRs: 0,
  prs: [],
  openPRs: 0,
  mergedPRs: 0,
  closedPRs: 0,
  mergeRate: 0,
  avgReviewTime: 0,
  avgTimeToFirstReview: 0,
  avgCycleTime: 0,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 0,
  reviewsReceived: 0,
  avgReviewResponseTime: 0,
  fastestReview: 0,
  slowestReview: 0,
  repoPerformance: [],
  highlights: {},
};

function mockFetchWith(data: PRInsightData = emptyInsights) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    })
  );
}

describe('PRInsightsClient - Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('1. renders safely without crashing when the API returns an empty dataset', async () => {
    mockFetchWith(emptyInsights);
    render(<PRInsightsClient username="octocat" />);

    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();
    expect(screen.getByText('Start contributing to see your insights here!')).toBeInTheDocument();
  });

  it('2. handles null, undefined, or empty username props gracefully without runtime exceptions', async () => {
    mockFetchWith(emptyInsights);
    const { rerender } = render(<PRInsightsClient username={undefined as unknown as string} />);
    expect(screen.getByText('Crunching your pull requests...')).toBeInTheDocument();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    expect(() => rerender(<PRInsightsClient username={null as unknown as string} />)).not.toThrow();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    expect(() => rerender(<PRInsightsClient username="" />)).not.toThrow();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();
  });

  it('3. verifies that the default layout and styling remain stable in the empty state', async () => {
    mockFetchWith(emptyInsights);
    render(<PRInsightsClient username="octocat" />);

    const fallbackText = await screen.findByText('No pull request activity found.');
    const wrapperElement = fallbackText.parentElement;

    expect(wrapperElement).toBeInTheDocument();
    expect(wrapperElement?.className).toContain('flex');
    expect(wrapperElement?.className).toContain('flex-col');
    expect(wrapperElement?.className).toContain('items-center');
    expect(wrapperElement?.className).toContain('justify-center');
    expect(wrapperElement?.className).toContain('border-dashed');
  });

  it('4. ensures no runtime errors occur during multiple sequential re-renders with empty inputs', async () => {
    mockFetchWith(emptyInsights);
    const { rerender } = render(<PRInsightsClient username="user-1" />);

    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    expect(() => rerender(<PRInsightsClient username="user-2" />)).not.toThrow();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    expect(() => rerender(<PRInsightsClient username="" />)).not.toThrow();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    expect(() => rerender(<PRInsightsClient username="user-3" />)).not.toThrow();
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();
  });

  it('5. confirms placeholder loaders, empty markers, and error fallbacks exist when data is unavailable', async () => {
    // 1. Loading state placeholder
    mockFetchWith(emptyInsights);
    const { rerender } = render(<PRInsightsClient username="octocat" />);
    expect(screen.getByText('Crunching your pull requests...')).toBeInTheDocument();

    // Settle initial loading state
    expect(await screen.findByText('No pull request activity found.')).toBeInTheDocument();

    // 2. Error fallback placeholder
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    rerender(<PRInsightsClient username="failed-user" />);
    expect(await screen.findByText(/Error loading insights/i)).toBeInTheDocument();
  });
});
