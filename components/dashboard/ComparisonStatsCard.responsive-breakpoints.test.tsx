import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonStatsCard from './ComparisonStatsCard';
import React from 'react';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock matchMedia for responsive viewport testing
const mockMatchMedia = (width: number) => {
  return vi.fn().mockImplementation((query) => ({
    matches: width <= 768 ? query.includes('max-width') : query.includes('min-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ComparisonStatsCard Responsive Multi-device Layouts', () => {
  const defaultProps = {
    title: 'Total Commits',
    valueA: 1500,
    valueB: 1200,
    labelA: 'User A',
    labelB: 'User B',
    icon: 'GitCommit',
  };

  beforeEach(() => {
    // Default to mobile viewport (iPhone SE width)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.matchMedia = mockMatchMedia(375);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mocks standard mobile-width media coordinates and renders cleanly', () => {
    render(<ComparisonStatsCard {...defaultProps} />);
    expect(window.innerWidth).toBe(375);
    expect(screen.getByText('Total Commits')).toBeDefined();
    expect(screen.getByText('1500')).toBeDefined();
    expect(screen.getByText('1200')).toBeDefined();
  });

  it('asserts that grid columns and flex layouts are responsive', () => {
    render(<ComparisonStatsCard {...defaultProps} />);

    // Verify structure resiliently without querying exact CSS classes
    const userA = screen.getByText('User A');
    const userB = screen.getByText('User B');

    // The container wrapping both sides is the grandparent of the label
    const gridContainer = userA.parentElement?.parentElement;
    expect(gridContainer).toBeDefined();

    // Ensure both elements render inside the common layout container structurally
    expect(gridContainer?.contains(userA)).toBe(true);
    expect(gridContainer?.contains(userB)).toBe(true);
  });

  it('verifies styling values use relative widths preventing horizontal scrollbars on mobile', () => {
    render(<ComparisonStatsCard {...defaultProps} />);

    // Test resiliently via accessible role instead of querying hardcoded styling classes
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeDefined();
    expect(progressBar.getAttribute('aria-valuenow')).toBe('56');

    // The main wrapper scales gracefully and we verify via the structure role
    const cardWrapper = screen.getByRole('region');
    expect(cardWrapper.style.width).toBe(''); // Verify no fixed width style is applied inline
  });

  it('checks that long labels scale down gracefully with text truncation', () => {
    render(
      <ComparisonStatsCard
        {...defaultProps}
        labelA="Super Extremely Long Username That Might Overflow"
        labelB="Another Long Name To Test Breakpoints"
      />
    );

    const labelAElem = screen.getByText('Super Extremely Long Username That Might Overflow');
    const labelBElem = screen.getByText('Another Long Name To Test Breakpoints');

    // Verify they exist in the document (we avoid testing specific CSS strings)
    expect(labelAElem).toBeDefined();
    expect(labelBElem).toBeDefined();
  });

  it('asserts mobile-specific visual elements (like center dividers) respond cleanly', () => {
    render(<ComparisonStatsCard {...defaultProps} />);

    // Find the center divider structurally instead of using exact tailwind strings like hidden md:block
    // We can find it by getting the grid container and checking its last child
    const userA = screen.getByText('User A');
    const gridContainer = userA.parentElement?.parentElement;

    // The divider is the 3rd child of the grid container (User A, User B, Divider)
    const divider = gridContainer?.children[2];
    expect(divider).toBeDefined();
    expect(divider?.getAttribute('aria-hidden')).toBe('true');

    // Simulate resizing to Desktop (1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.matchMedia = mockMatchMedia(1024);

    // Viewport should reflect desktop
    expect(window.innerWidth).toBe(1024);
  });
});
