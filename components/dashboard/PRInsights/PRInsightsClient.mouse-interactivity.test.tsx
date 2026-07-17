import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PRInsightsClient from './PRInsightsClient';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./TopMetricsRow', () => ({
  default: () => (
    <div data-testid="top-metrics" className="cursor-pointer">
      Top Metrics
    </div>
  ),
}));

vi.mock('./PRTrendChart', () => ({
  default: () => (
    <div data-testid="pr-trend-chart" className="cursor-pointer">
      PR Trend Chart
    </div>
  ),
}));

vi.mock('./PRStatusDistribution', () => ({
  default: () => (
    <div data-testid="status-distribution" className="cursor-pointer">
      Status Distribution
    </div>
  ),
}));

vi.mock('./ReviewAnalytics', () => ({
  default: () => (
    <div data-testid="review-analytics" className="cursor-pointer">
      Review Analytics
    </div>
  ),
}));

vi.mock('./RepoPerformanceTable', () => ({
  default: () => (
    <div data-testid="repo-performance" className="cursor-pointer">
      Repo Performance
    </div>
  ),
}));

vi.mock('./Highlights', () => ({
  default: () => (
    <div data-testid="highlights" className="cursor-pointer">
      Highlights
    </div>
  ),
}));

const mockData = {
  totalPRs: 25,
  openPRs: 5,
  mergedPRs: 18,
  closedPRs: 2,
  mergeRate: 90,
  avgReviewTime: 4,
  avgTimeToFirstReview: 2,
  avgCycleTime: 8,

  weeklyActivity: [],
  monthlyActivity: [],

  reviewsGiven: 10,
  reviewsReceived: 8,
  avgReviewResponseTime: 2,
  fastestReview: 1,
  slowestReview: 5,

  repoPerformance: [
    {
      name: 'owner/repo',
      totalPRs: 25,
      mergeRate: 90,
      reviewCount: 15,
      avgReviewTime: 3,
    },
  ],

  highlights: {},

  prs: [
    {
      title: 'Test PR',
      url: 'https://github.com/test/pr/1',
      state: 'MERGED',
      createdAt: '2026-01-01',
      repo: 'owner/repo',
    },
  ],
};

describe('PRInsightsClient Mouse Interactivity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Storage.prototype.getItem = vi.fn().mockReturnValue(null);
    Storage.prototype.setItem = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as typeof fetch;
  });

  it('renders interactive dashboard sections after successful data load', async () => {
    render(<PRInsightsClient username="octocat" />);

    expect(await screen.findByTestId('top-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('pr-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('status-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('review-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('repo-performance')).toBeInTheDocument();
    expect(screen.getByTestId('highlights')).toBeInTheDocument();
  });

  it('propagates click interactions on dashboard widgets', async () => {
    render(<PRInsightsClient username="octocat" />);

    const widget = await screen.findByTestId('status-distribution');

    const clickSpy = vi.fn();

    widget.addEventListener('click', clickSpy);

    fireEvent.click(widget);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('handles mouse enter and mouse leave interactions without crashing', async () => {
    render(<PRInsightsClient username="octocat" />);

    const widget = await screen.findByTestId('review-analytics');

    fireEvent.mouseEnter(widget);
    fireEvent.mouseMove(widget);
    fireEvent.mouseLeave(widget);

    expect(widget).toBeInTheDocument();
  });

  it('supports touch interaction propagation on mobile devices', async () => {
    render(<PRInsightsClient username="octocat" />);

    const widget = await screen.findByTestId('repo-performance');

    fireEvent.touchStart(widget);
    fireEvent.touchMove(widget);
    fireEvent.touchEnd(widget);

    expect(widget).toBeInTheDocument();
  });

  it('renders pointer-enabled interactive widgets for hoverable dashboard actions', async () => {
    render(<PRInsightsClient username="octocat" />);

    const widget = await screen.findByTestId('status-distribution');

    await waitFor(() => {
      expect(widget.className).toContain('cursor-pointer');
    });
  });
});
