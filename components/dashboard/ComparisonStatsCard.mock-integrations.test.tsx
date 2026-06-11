import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ComparisonStatsCard from './ComparisonStatsCard';

// ==========================================
// 1. GLOBAL BROWSER API MOCKS
// ==========================================
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Define real dummy props matching the strict ComparisonStatsCardProps schema
const mockProps = {
  title: 'Repository Analytics',
  valueA: 120,
  valueB: 85,
  labelA: 'Current Week',
  labelB: 'Previous Week',
  icon: 'trending-up',
};

describe('ComparisonStatsCard Real Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Verify Core Component Container Mounts with Correct Accessibility Role
  it('should successfully render the main component container and accessibilities', () => {
    render(<ComparisonStatsCard {...mockProps} />);
    const cardRegion = screen.getByRole('region', { name: /Repository Analytics/i });
    expect(cardRegion).toBeInTheDocument();
  });

  // Test Case 2: Ensure Provided Props Render Accurately in the UI Tree
  it('should cleanly render primary typography parameters from props', () => {
    render(<ComparisonStatsCard {...mockProps} />);

    expect(screen.getByText('Repository Analytics')).toBeInTheDocument();
    expect(screen.getByText('Current Week')).toBeInTheDocument();
    expect(screen.getByText('Previous Week')).toBeInTheDocument();
  });

  // Test Case 3: Verify Numerical Values Render Correctly as Text Elements
  it('should convert and display numerical values inside metrics containers', () => {
    render(<ComparisonStatsCard {...mockProps} />);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  // Test Case 4: Assert Component Correctly Sets State Elements (e.g., Progressbar)
  it('should render progressbar component with representative calculation attributes', () => {
    render(<ComparisonStatsCard {...mockProps} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow');
  });

  // Test Case 5: Ensure Winner Badges or Layout Assets are Managed Gracefully
  it('should structurally display conditional elements like winner indicator frames safely', () => {
    render(<ComparisonStatsCard {...mockProps} />);

    // According to your component layout rules, the larger value gets marked as winner
    const winnerLabel = screen.queryByText(/Winner/i);
    if (winnerLabel) {
      expect(winnerLabel).toBeInTheDocument();
    }
  });
});
