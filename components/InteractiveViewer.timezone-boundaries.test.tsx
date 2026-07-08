import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractiveViewer, { formatDate } from './InteractiveViewer';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./dashboard/VisualizationTooltip', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="visualization-tooltip">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

describe('InteractiveViewer Timezone Boundaries', () => {
  it('formats leap-year dates correctly without gaps', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('formats daylight-saving spring-forward boundary dates correctly', () => {
    expect(formatDate('2026-03-08')).toBe('Mar 8, 2026');
  });

  it('formats daylight-saving fall-back boundary dates correctly', () => {
    expect(formatDate('2026-11-01')).toBe('Nov 1, 2026');
  });

  it('renders tooltip dates correctly for leap-year activity blocks', async () => {
    render(
      <InteractiveViewer>
        <div
          className="interactive-tower"
          data-testid="leap-tower"
          data-date="2024-02-29"
          data-count="100"
          data-metric="Commits"
        >
          Leap Day
        </div>
      </InteractiveViewer>
    );

    const tower = screen.getByTestId('leap-tower');

    vi.spyOn(tower, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 140,
      bottom: 160,
      width: 40,
      height: 60,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(tower, {
      clientX: 120,
      clientY: 120,
    });

    expect(await screen.findByTestId('visualization-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Feb 29, 2024')).toBeInTheDocument();
  });

  it('uses UTC timezone normalization when formatting dates', () => {
    const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');

    formatDate('2025-06-15');

    expect(localeSpy).toHaveBeenCalledWith(
      'en-US',
      expect.objectContaining({
        timeZone: 'UTC',
      })
    );

    localeSpy.mockRestore();
  });
});
