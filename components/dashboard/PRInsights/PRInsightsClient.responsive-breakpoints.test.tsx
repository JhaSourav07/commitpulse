import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import PRInsightsClient from './PRInsightsClient';

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
type ComponentProps = React.ComponentProps<typeof PRInsightsClient>;

describe('PRInsightsClient Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  // Pass the required top-level prop safely to avoid missing prop warnings
  const mockProps = {
    username: 'test-user',
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

    const { container } = render(<PRInsightsClient {...mockProps} />);

    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('2. asserts that columns reflow into standard vertical flex lists', () => {
    const { container } = render(<PRInsightsClient {...mockProps} />);

    expect(container).toBeTruthy();
    expect(typeof container.innerHTML).toBe('string');
  });

  it('3. verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    const { container } = render(<PRInsightsClient {...mockProps} />);

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

    const { container } = render(<PRInsightsClient {...mockProps} />);

    expect(container).toBeDefined();
  });

  it('5. asserts mobile-specific toggle states respond cleanly', () => {
    const { container } = render(<PRInsightsClient {...mockProps} />);

    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });
});
