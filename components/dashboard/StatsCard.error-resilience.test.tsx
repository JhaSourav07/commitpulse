/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
  LucideIcon: () => null,
}));

describe('StatsCard Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Invalid icon name falls back to Flame icon
  it('should fall back to Flame icon when icon name is invalid', () => {
    render(
      <StatsCard
        title="Test Stats"
        value="100"
        description="test description"
        icon="InvalidIconName"
      />
    );

    expect(screen.getByTestId('icon-flame')).toBeDefined();
  });

  // Test 2: undefined chartData falls back to generated chart data
  it('should fall back to generated chart data when chartData is undefined', () => {
    render(
      <StatsCard
        title="Test Stats"
        value="100"
        description="test description"
        icon="Flame"
        chartData={undefined}
      />
    );

    // Verify component renders without crashing
    expect(screen.getByText('Test Stats')).toBeDefined();

    // Verify chart bars are rendered (12 bars from generated fallback data)
    const motionDiv = screen.getByTestId('motion-div');
    const chartBars = motionDiv.querySelectorAll('[style*="height"]');
    expect(chartBars.length).toBe(12);
  });

  // Test 3: empty chartData array falls back to generated chart data
  it('should fall back to generated chart data when chartData is an empty array', () => {
    render(
      <StatsCard
        title="Test Stats"
        value="100"
        description="test description"
        icon="Flame"
        chartData={[]}
      />
    );

    // Verify component renders without crashing
    expect(screen.getByText('Test Stats')).toBeDefined();

    // Verify chart bars are rendered (12 bars from generated fallback data)
    const motionDiv = screen.getByTestId('motion-div');
    const chartBars = motionDiv.querySelectorAll('[style*="height"]');
    expect(chartBars.length).toBe(12);
  });

  // Test 4: Component renders successfully when optional props are omitted
  it('should render successfully when optional props (utcDate, chartData) are omitted', () => {
    render(
      <StatsCard title="Test Stats" value="100" description="test description" icon="TrendingUp" />
    );

    // Verify all required content renders
    expect(screen.getByText('Test Stats')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('test description')).toBeDefined();
    expect(screen.getByTestId('icon-trending-up')).toBeDefined();

    // Verify no UTC disclaimer appears
    expect(
      screen.queryByText(/Streaks are calculated in UTC and may differ from your local timezone/i)
    ).toBeNull();

    // Verify chart still renders with fallback data
    const motionDiv = screen.getByTestId('motion-div');
    const chartBars = motionDiv.querySelectorAll('[style*="height"]');
    expect(chartBars.length).toBe(12);
  });

  // Test 5: Component handles very large chartData array without crashing
  it('should handle very large chartData arrays without crashing and render chart bars correctly', () => {
    // Create a large array with 1000 data points
    const largeChartData = Array.from({ length: 1000 }).map((_, i) => Math.random() * 100);

    render(
      <StatsCard
        title="Test Stats"
        value="100"
        description="test description"
        icon="GitCommit"
        chartData={largeChartData}
      />
    );

    // Verify component renders without crashing
    expect(screen.getByText('Test Stats')).toBeDefined();

    // Verify all 1000 chart bars are rendered
    const motionDiv = screen.getByTestId('motion-div');
    const chartBars = motionDiv.querySelectorAll('[style*="height"]');
    expect(chartBars.length).toBe(1000);

    // Verify each bar has a calculated height within expected range
    chartBars.forEach((bar) => {
      const heightStyle = bar.getAttribute('style');
      expect(heightStyle).toMatch(/height: \d+(\.\d+)?%/);
    });
  });
});
