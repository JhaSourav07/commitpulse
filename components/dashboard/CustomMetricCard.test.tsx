/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomMetricCard from './CustomMetricCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CustomMetricCard', () => {
  const defaultProps = {
    totalCommits: 100,
    activeDays: 20,
    totalAdditions: 4000,
    totalDeletions: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header title and metric card container', () => {
    render(<CustomMetricCard {...defaultProps} />);
    expect(screen.getByText('Custom Metric & Filter Panel')).toBeDefined();
    expect(screen.getByTestId('custom-metric-card')).toBeDefined();
  });

  it('calculates default Commit Velocity ratio correctly (100 commits / 20 days = 5)', () => {
    render(<CustomMetricCard {...defaultProps} />);
    const metricValue = screen.getByTestId('metric-value-display');
    expect(metricValue.textContent).toBe('5');
  });

  it('switches metric preset when clicking on preset buttons', () => {
    render(<CustomMetricCard {...defaultProps} />);

    // Click Code Impact Ratio button
    const impactButton = screen.getByRole('button', { name: /Code Impact Ratio/i });
    fireEvent.click(impactButton);

    // Code impact ratio = (4000 / (4000 + 1000)) * 100 = 80%
    const metricValue = screen.getByTestId('metric-value-display');
    expect(metricValue.textContent).toBe('80');
  });

  it('updates metrics when date range filter changes', () => {
    const handleFilterChange = vi.fn();
    render(<CustomMetricCard {...defaultProps} onFilterChange={handleFilterChange} />);

    const select = screen.getByLabelText(/Date Range Filter/i);
    fireEvent.change(select, { target: { value: '7d' } });

    expect(handleFilterChange).toHaveBeenCalledWith({
      dateRange: '7d',
      tagFilter: '',
    });
  });

  it('handles keyword tag filtering and quick clear', () => {
    const handleFilterChange = vi.fn();
    render(<CustomMetricCard {...defaultProps} onFilterChange={handleFilterChange} />);

    const tagInput = screen.getByLabelText(/Filter by Keyword\/Tag/i);
    fireEvent.change(tagInput, { target: { value: 'feat' } });

    expect(handleFilterChange).toHaveBeenCalledWith({
      dateRange: 'all',
      tagFilter: 'feat',
    });

    // Clear tag filter using individual clear X button
    const clearTagBtn = screen.getByLabelText('Clear tag filter');
    fireEvent.click(clearTagBtn);

    expect(handleFilterChange).toHaveBeenCalledWith({
      dateRange: 'all',
      tagFilter: '',
    });
  });

  it('shows Reset All Filters button when filters are active and clears all filters on click', () => {
    const handleFilterChange = vi.fn();
    render(<CustomMetricCard {...defaultProps} onFilterChange={handleFilterChange} />);

    // Apply a filter first
    const select = screen.getByLabelText(/Date Range Filter/i);
    fireEvent.change(select, { target: { value: '30d' } });

    const resetBtn = screen.getByLabelText('Reset all quick filters');
    expect(resetBtn).toBeDefined();

    fireEvent.click(resetBtn);

    expect(handleFilterChange).toHaveBeenLastCalledWith({
      dateRange: 'all',
      tagFilter: '',
    });
  });
});
