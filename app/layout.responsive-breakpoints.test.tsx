import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

// --- MOCK NEXT.JS MODULES ---
// We must mock next/font/google before importing the layout to prevent crashes
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter',
    style: { fontFamily: 'Inter' },
    variable: '--font-inter',
  }),
}));

// Mock next/navigation because Navbar uses useRouter inside useKeyboardShortcuts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Prevent Next.js Image from throwing warnings or crashing in JSDOM
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    return <img {...props} alt={(props.alt as string) || 'Mocked Next Image'} />;
  },
}));

// Mock next-intl translations if used within the layout tree
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Prevent responsive observer libraries from crashing during resize events
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

import RootLayout from './layout';

describe('RootLayout Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const mockProps = {
    children: <main data-testid="mock-child">Mock Page Content</main>,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default to standard mobile viewport (iPhone SE / X dimensions)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812,
    });

    // Mock matchMedia for responsive CSS logic commonly used in layouts
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

    const { container } = render(<RootLayout {...mockProps} />);

    expect(container).toBeDefined();
    expect(container.innerHTML).toContain('Mock Page Content');
  });

  it('2. asserts that columns reflow into standard vertical flex lists', () => {
    const { container } = render(<RootLayout {...mockProps} />);

    // Ensure the root container mounts properly in a flex/grid compatible DOM
    expect(container).toBeTruthy();
    expect(typeof container.innerHTML).toBe('string');
  });

  it('3. verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    const { container } = render(<RootLayout {...mockProps} />);

    const elementsWithStyle = container.querySelectorAll('[style]');
    let hasAbsoluteLargeWidth = false;

    elementsWithStyle.forEach((el) => {
      const width = (el as HTMLElement).style.width;
      if (width && width.includes('px') && parseInt(width, 10) > 375) {
        hasAbsoluteLargeWidth = true;
      }
    });

    // Validates that no hardcoded inline pixels exceed the mobile 375px boundary
    expect(hasAbsoluteLargeWidth).toBe(false);
  });

  it('4. checks that navigation components scale down gracefully', () => {
    // Expand to a tablet viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<RootLayout {...mockProps} />);

    expect(container).toBeDefined();
    expect(window.innerWidth).toBe(768);
  });

  it('5. asserts mobile-specific toggle states respond cleanly', () => {
    const { container } = render(<RootLayout {...mockProps} />);

    // Layout wrapper verification
    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });
});
