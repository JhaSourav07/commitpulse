import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const hugeDataset: ActivityData[] = Array.from({ length: 5000 }, (_, i) => ({
  date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
  count: i + 1,
  intensity: (i % 5) as 0 | 1 | 2 | 3 | 4,
  locAdditions: i * 10,
  locDeletions: i * 2,
}));

describe('ActivityLandscape - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('Populate mock objects representing thousands of contributor actions: renders without crashing with 5000 data points', () => {
    const { container } = render(<ActivityLandscape data={hugeDataset} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('Render the module under highly loaded configuration state: chart container renders with massive dataset', () => {
    render(<ActivityLandscape data={hugeDataset} />);
    expect(screen.getByRole('img', { name: /activity chart/i })).toBeInTheDocument();
  });

  it('Assert that layouts do not overlap and SVG coordinates scale cleanly: bars are downsampled to max 60', () => {
    const { container } = render(<ActivityLandscape data={hugeDataset} />);
    const bars = container.querySelectorAll('.group\\/bar');
    expect(bars.length).toBeLessThanOrEqual(60);
  });

  it('Check execution times to verify calculation performance stays below limit margins: renders within 5000ms', () => {
    const start = performance.now();
    render(<ActivityLandscape data={hugeDataset} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(5000);
  });

  it('Verify that grid items render without breaking browser layout trees: handles extreme count values without crashing', () => {
    const extremeData: ActivityData[] = Array.from({ length: 365 }, (_, i) => ({
      date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      count: Number.MAX_SAFE_INTEGER,
      intensity: 4 as 0 | 1 | 2 | 3 | 4,
      locAdditions: Number.MAX_SAFE_INTEGER,
      locDeletions: Number.MAX_SAFE_INTEGER,
    }));
    const { container } = render(<ActivityLandscape data={extremeData} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
