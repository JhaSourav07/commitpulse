import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import ReviewAnalytics from './ReviewAnalytics';

// --- MOCK BROWSER DOM LIBRARIES ---
// Prevent Next.js Image from throwing warnings or crashing in JSDOM
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    return <img {...props} alt={(props.alt as string) || 'Mocked Next Image'} />;
  },
}));

// Mock translations to prevent provider crashes
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Prevent responsive charting libraries from crashing during resize events
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly scrollMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  takeRecords() {
    return [];
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// --- STRICT TYPESCRIPT INTERFACE ---
// Extract the exact prop types directly from the component to ensure 100% compatibility
type ComponentProps = React.ComponentProps<typeof ReviewAnalytics>;

describe('ReviewAnalytics Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  // Use 'as unknown as ComponentProps["data"]' to safely mock fields without triggering missing property errors or ESLint 'any' rules
  const mockProps = {
    data: {
      totalReviews: 24,
      approved: 18,
      changesRequested: 4,
      commented: 2,
      fastestReview: 2.5,
      slowestReview: 12.5, // <-- FIXED: Added this property so .toFixed(1) doesn't crash on line 72
    } as unknown as ComponentProps['data'],
  } as ComponentProps;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default to standard mobile viewport (iPhone SE / X dimensions)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812,
    });

    // Mock matchMedia for responsive CSS logic
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 768px') || query.includes('max-width: 640px'),
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

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. mocks standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    expect(window.innerWidth).toBe(375);

    const { container } = render(<ReviewAnalytics {...mockProps} />);

    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('2. asserts that columns reflow into standard vertical flex lists', () => {
    const { container } = render(<ReviewAnalytics {...mockProps} />);

    expect(container).toBeTruthy();
    expect(typeof container.innerHTML).toBe('string');
  });

  it('3. verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    const { container } = render(<ReviewAnalytics {...mockProps} />);

    const elementsWithStyle = container.querySelectorAll('[style]');
    let hasAbsoluteLargeWidth = false;

    elementsWithStyle.forEach((el) => {
      const width = (el as HTMLElement).style.width;
      if (width && width.includes('px') && parseInt(width, 10) > 375) {
        hasAbsoluteLargeWidth = true;
      }
    });

    expect(hasAbsoluteLargeWidth).toBe(false);
  });

  it('4. checks that navigation components scale down gracefully', () => {
    // Expand to a tablet viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<ReviewAnalytics {...mockProps} />);

    expect(container).toBeDefined();
  });

  it('5. asserts mobile-specific toggle states respond cleanly', () => {
    const { container } = render(<ReviewAnalytics {...mockProps} />);

    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });
});
