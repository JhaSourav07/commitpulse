import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import HistoricalTrendView from './HistoricalTrendView';

import type { ActivityData } from '@/types/dashboard';

/**
 * Router mock
 */
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

/**
 * Heatmap mock (prevents heavy SVG rendering)
 */
vi.mock('./Heatmap', () => ({
  default: () => <div data-testid="heatmap" />,
}));

/**
 * Deterministic massive dataset generator (CI SAFE)
 */
function generateActivity(size: number): ActivityData[] {
  const intensityValues: ActivityData['intensity'][] = [0, 1, 2, 3, 4];

  return Array.from({ length: size }, (_, i) => ({
    date: `2026-01-${String((i % 30) + 1).padStart(2, '0')}`,
    count: i % 5, // deterministic
    intensity: intensityValues[i % intensityValues.length],
  }));
}

const basePeriod = {
  kind: 'month' as const,
  month: '2026-01',
  label: 'Jan 2026',
  from: '2026-01-01',
  to: '2026-01-31',
};

describe('HistoricalTrendView — Massive Scaling Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 1. Massive dataset render stability
   */
  it('renders 5000 records without breaking layout content', () => {
    const data = generateActivity(5000);

    render(<HistoricalTrendView username="test" activity={data} period={basePeriod} />);

    expect(screen.getByText(/Historical Trend View/i)).toBeInTheDocument();
    expect(screen.getByText(/Contributions/i)).toBeInTheDocument();
  }, 10000);

  /**
   * 2. Layout integrity under heavy load
   */
  it('renders stat cards without layout break under load', () => {
    const data = generateActivity(3000);

    render(<HistoricalTrendView username="test" activity={data} period={basePeriod} />);

    expect(screen.getByText(/Contributions/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Days/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Longest Streak/i)).toBeInTheDocument();
  });

  /**
   * 3. SVG rendering stability (sparkline integrity)
   */
  it('renders valid SVG sparkline without breaking DOM', () => {
    const data = generateActivity(2000);

    render(<HistoricalTrendView username="test" activity={data} period={basePeriod} />);

    const sparkline = screen.getByTestId('streak-sparkline');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline.querySelector('polyline')).toHaveAttribute('points');
  });

  /**
   * 4. Monthly + yearly aggregation stability
   */
  it('renders monthly and yearly summaries correctly', () => {
    const data = generateActivity(4000);

    render(<HistoricalTrendView username="test" activity={data} period={basePeriod} />);

    expect(screen.getByText(/Monthly Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Yearly Summary/i)).toBeInTheDocument();
  });

  /**
   * 5. Heatmap integration under extreme load
   */
  it('renders heatmap safely with large dataset', () => {
    const data = generateActivity(5000);

    render(<HistoricalTrendView username="test" activity={data} period={basePeriod} />);

    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  });
});
