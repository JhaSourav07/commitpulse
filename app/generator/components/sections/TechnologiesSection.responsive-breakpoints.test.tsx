import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TechnologiesSection } from './TechnologiesSection';

// Mock lucide-react to render clean, simplified test elements
vi.mock('lucide-react', () => ({
  Search: (props: Record<string, unknown>) => <div data-testid="search-icon" {...props} />,
  X: (props: Record<string, unknown>) => <div data-testid="x-icon" {...props} />,
  ChevronDown: (props: Record<string, unknown>) => (
    <div data-testid="chevron-down-icon" {...props} />
  ),
}));

describe('TechnologiesSection - Responsive Breakpoints & Mobile Layouts', () => {
  // Helper utility to mimic window viewport resizing in JSDOM environment
  const resizeViewport = (width: number, height = 800) => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    // Standard mock window.matchMedia
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes(`${window.innerWidth}`),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  // Test Case 1: Mock common mobile viewport widths and verify responsive rendering remains correct
  test('1. mock common mobile viewport widths (375px, 390px, 768px) and verify responsive rendering remains correct', () => {
    const viewports = [375, 390, 768];
    const onChange = vi.fn();

    viewports.forEach((width) => {
      resizeViewport(width);
      const { unmount } = render(<TechnologiesSection selected={[]} onChange={onChange} />);

      // Verify that major layout structures remain interactive and render correctly
      expect(screen.getByPlaceholderText(/Search technologies.../i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Technologies' })).toBeInTheDocument();

      // Unmount between viewport changes
      unmount();
    });
  });

  // Test Case 2: Verify layout columns reflow correctly into mobile-friendly layouts without invalid structures
  test('2. verify layout columns reflow correctly into mobile-friendly layouts using flex-wrap and grid-cols-1', () => {
    resizeViewport(375);
    const { container } = render(
      <TechnologiesSection selected={['javascript', 'typescript']} onChange={vi.fn()} />
    );

    // Verify category navigation layout has wrap property to allow vertical flow on mobile
    const categoryNav = container.querySelector('[aria-label="Technology Categories"]');
    expect(categoryNav).toBeInTheDocument();
    expect(categoryNav).toHaveClass('flex-wrap');

    // Verify selected technologies wrap container has flex-wrap to reflow items
    const selectedContainer = container.querySelector('.mb-4 .flex-wrap');
    expect(selectedContainer).toBeInTheDocument();
    expect(selectedContainer).toHaveClass('flex-wrap');

    // Verify main technologies list has single-column grid cols layout on mobile
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1');
  });

  // Test Case 3: Assert responsive styling avoids fixed widths that could introduce horizontal scrolling
  test('3. assert responsive styling avoids fixed widths that could introduce horizontal scrolling on small screens', () => {
    resizeViewport(375);
    const { container } = render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);

    // Search input should scale fluidly using percentage/flex widths (e.g. w-full) instead of absolute pixel widths
    const searchInput = screen.getByPlaceholderText(/Search technologies.../i);
    expect(searchInput).toHaveClass('w-full');
    expect(searchInput).not.toHaveStyle({ width: expect.stringMatching(/^\d+px$/) });

    // Grid list buttons should span fully and adaptively
    const techButtons = container.querySelectorAll('.grid button');
    expect(techButtons.length).toBeGreaterThan(0);
    techButtons.forEach((btn) => {
      expect(btn).toHaveClass('w-full');
      expect(btn).not.toHaveStyle({ width: expect.stringMatching(/^\d+px$/) });
    });
  });

  // Test Case 4: Verify responsive navigation or layout helpers adapt correctly across breakpoints
  test('4. verify responsive navigation or layout helpers adapt correctly across mobile, tablet, and desktop breakpoints', () => {
    const { container, rerender } = render(
      <TechnologiesSection selected={[]} onChange={vi.fn()} />
    );

    // Mobile viewport
    resizeViewport(375);
    rerender(<TechnologiesSection selected={[]} onChange={vi.fn()} />);
    const categoryNavMobile = container.querySelector('[aria-label="Technology Categories"]');
    expect(categoryNavMobile).toHaveClass('overflow-x-auto');

    // Tablet viewport
    resizeViewport(768);
    rerender(<TechnologiesSection selected={[]} onChange={vi.fn()} />);
    expect(categoryNavMobile).toBeInTheDocument();

    // Desktop viewport
    resizeViewport(1440);
    rerender(<TechnologiesSection selected={[]} onChange={vi.fn()} />);
    expect(categoryNavMobile).toBeInTheDocument();
  });

  // Test Case 5: Ensure missing or invalid viewport information falls back safely without runtime errors
  test('5. ensure missing or invalid viewport information falls back safely without runtime errors', () => {
    const originalInnerWidth = window.innerWidth;

    // Delete innerWidth or set it to undefined to check fallback robustness
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { unmount } = render(<TechnologiesSection selected={[]} onChange={vi.fn()} />);
    unmount();

    // Set invalid negative value
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: -100,
    });

    const { unmount: unmountNegative } = render(
      <TechnologiesSection selected={[]} onChange={vi.fn()} />
    );
    unmountNegative();

    // Restore innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });
});
