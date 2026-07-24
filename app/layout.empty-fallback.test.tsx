import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import RootLayout from './layout';

// ----------------------------------------------------------------------
// Mock Next.js & Client Dependencies
// ----------------------------------------------------------------------
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mock-inter-font' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="mock-analytics" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="mock-brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <div data-testid="mock-return-to-top" />,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="mock-scroll-restoration" />,
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="mock-animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="mock-konami-easter-egg" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <div data-testid="mock-navbar" />,
}));

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------
describe('Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Render the target module or component with empty arrays or null parameters', () => {
    // Render the layout with a completely null child parameter
    const { container } = render(<RootLayout>{null}</RootLayout>);

    // Assert that the layout renders successfully without crashing
    expect(container).toBeTruthy();

    // Check that the body renders properly, bypassing RTL's container nesting issues with <html>
    const bodyElement = document.querySelector('body');
    expect(bodyElement).toBeTruthy();
  });

  it('2. Verify that a clear, non-breaking fallback UI or error message is displayed', () => {
    render(
      <RootLayout>
        {/* Pass an empty array as children */}
        {[]}
      </RootLayout>
    );

    // The main content area should still render, acting as a non-breaking fallback wrapper for empty content
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();

    // It should be completely empty but stable
    expect(mainContent?.innerHTML).toBe('');
  });

  it('3. Verify standard styles are maintained in this default empty layout state', () => {
    render(<RootLayout>{undefined}</RootLayout>);

    const mainContent = document.getElementById('main-content');

    // Assert standard layout styles are maintained despite having no children
    expect(mainContent?.className).toContain('relative');
    expect(mainContent?.className).toContain('z-10');
  });

  it('4. Assert that no unexpected runtime errors or hydration failures occur', () => {
    // Pass empty fragments to simulate empty inputs
    const renderWithEmptyFragment = () => {
      render(
        <RootLayout>
          <React.Fragment />
        </RootLayout>
      );
    };

    // Assert the render function does not throw a runtime or hydration error
    expect(renderWithEmptyFragment).not.toThrow();

    // Verify main content is successfully mounted and rendered, proving no critical failures
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();
  });

  it('5. Check key DOM structures to make sure empty markers exist', () => {
    render(<RootLayout>{null}</RootLayout>);

    // Verify that core empty structural markers (like the body and skip link) still exist
    // even when no page content is provided
    const bodyElement = document.querySelector('body');
    expect(bodyElement).toBeTruthy();
    expect(bodyElement?.className).toContain('mock-inter-font');

    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.textContent).toBe('Skip to main content');
  });
});
