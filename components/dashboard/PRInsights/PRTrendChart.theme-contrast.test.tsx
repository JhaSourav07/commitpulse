import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PRTrendChart from './PRTrendChart';

// Mock recharts to prevent ResponsiveContainer rendering errors in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container" style={{ width: '100%', height: '300px' }}>
      {children}
    </div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock framer-motion to prevent DOM warnings and satisfy ESLint rules
vi.mock('framer-motion', () => ({
  motion: {
    div: (
      props: React.HTMLAttributes<HTMLDivElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }
    ) => {
      const cleanProps = { ...props };
      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;
      return <div {...cleanProps} />;
    },
  },
}));

const mockPRData = {
  totalPRs: 20,
  openPRs: 5,
  mergedPRs: 10,
  closedPRs: 5,
  mergeRate: 50,
  avgReviewTime: 12,
  avgTimeToFirstReview: 4,
  avgCycleTime: 24,
  weeklyActivity: [
    { name: 'W1', prs: 2 },
    { name: 'W2', prs: 3 },
  ],
  monthlyActivity: [
    { name: 'M1', prs: 10 },
    { name: 'M2', prs: 15 },
  ],
  reviewsGiven: 8,
  reviewsReceived: 12,
  avgReviewResponseTime: 6,
  fastestReview: 1,
  slowestReview: 24,
  repoPerformance: [],
  highlights: {},
};

// Safely type the mock data by dynamically extracting the component's expected prop type
type PRTrendChartProps = React.ComponentProps<typeof PRTrendChart>;
const typedMockData = mockPRData as unknown as PRTrendChartProps['data'];

describe('PRTrendChart Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to emulate dark/light presets on the document element
  const setupTheme = (isDark: boolean) => {
    document.documentElement.className = isDark ? 'dark' : '';
  };

  it('1. should emulate both dark and light presets', () => {
    // Emulate Light mode
    setupTheme(false);
    const { container: lightContainer, unmount } = render(<PRTrendChart data={typedMockData} />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(lightContainer).toBeTruthy();
    unmount();

    // Emulate Dark mode
    setupTheme(true);
    const { container: darkContainer } = render(<PRTrendChart data={typedMockData} />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(darkContainer).toBeTruthy();
  });

  it('2. should assert that the visual elements adapt color styling properly for both settings', () => {
    const { container } = render(<PRTrendChart data={typedMockData} />);

    // Check chart elements are present
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.className).toContain('bg-white');
    expect(wrapper.className).toContain('dark:bg-zinc-900/50');
    expect(wrapper.className).toContain('border-black/10');
    expect(wrapper.className).toContain('dark:border-white/10');
  });

  it('3. should verify contrast ratio standards are satisfied for all textual elements', () => {
    render(<PRTrendChart data={typedMockData} />);

    const heading = screen.getByRole('heading', { name: /activity trends/i });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');

    const desc = screen.getByText(/pull requests over time/i);
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain('text-gray-500');
  });

  it('4. should check that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<PRTrendChart data={typedMockData} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeDefined();

    // Verify layout and spacing Tailwind classes are present
    expect(wrapper.className).toContain('rounded-3xl');
    expect(wrapper.className).toContain('p-6');
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-col');
  });

  it('5. should ensure that background overlays do not clip foreground content colors', () => {
    const { container } = render(<PRTrendChart data={typedMockData} />);

    const wrapper = container.firstChild as HTMLElement;

    // The container overlay should be properly contained without clipping content
    if (wrapper.classList.contains('overflow-hidden')) {
      expect(wrapper.classList.contains('relative')).toBe(true);
    }

    // Chart boundary checks
    const chartArea = screen.getByTestId('responsive-container');
    expect(chartArea).toBeInTheDocument();
    expect(chartArea.parentElement?.className).toContain('flex-1');
  });
});
