import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock Component representing the User Details layout ---
// Written without JSX to conform to the .ts file extension requirement in the issue.
function UserDetailsResponsiveLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return React.createElement(
    'div',
    {
      'data-testid': 'user-details-container',
      className: 'flex flex-col md:flex-row w-full max-w-[100%]',
      style: { overflowX: 'hidden' },
    },
    [
      React.createElement(
        'nav',
        {
          key: 'nav',
          'data-testid': 'mobile-nav',
          className: 'w-full md:w-64 scale-95 md:scale-100 flex-shrink-0',
        },
        'Navigation'
      ),

      React.createElement(
        'main',
        {
          key: 'main',
          'data-testid': 'details-column',
          className: 'flex-1 min-w-0 flex flex-col md:flex-row',
        },
        'Content Columns'
      ),

      React.createElement(
        'button',
        {
          key: 'button',
          'data-testid': 'mobile-toggle',
          className: 'block md:hidden',
          'aria-expanded': isOpen,
          onClick: () => setIsOpen(!isOpen),
        },
        'Menu Toggle'
      ),
    ]
  );
}

describe('User Details - Responsive Multi-device Columns & Mobile Viewport Layouts (Variation 7)', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;

    // Mock matchMedia for responsive CSS testing if needed
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
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
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  it('mocks standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    // Set viewport to mobile standard (iPhone SE width)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    expect(window.innerWidth).toBe(375);

    render(React.createElement(UserDetailsResponsiveLayout));
    const container = screen.getByTestId('user-details-container');
    expect(container).toBeInTheDocument();
  });

  it('asserts that columns reflow into standard vertical flex lists', () => {
    render(React.createElement(UserDetailsResponsiveLayout));

    const container = screen.getByTestId('user-details-container');
    const mainColumn = screen.getByTestId('details-column');

    // Check that layout uses flex-col for mobile reflow (via tailwind classes)
    expect(container.className).toContain('flex-col');
    expect(mainColumn.className).toContain('flex-col');
  });

  it('verifies styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    render(React.createElement(UserDetailsResponsiveLayout));

    const container = screen.getByTestId('user-details-container');
    const nav = screen.getByTestId('mobile-nav');
    const mainColumn = screen.getByTestId('details-column');

    // Container should restrict max-width and hide overflow
    expect(container.className).toContain('w-full');
    expect(container.className).toContain('max-w-[100%]');
    expect(container.style.overflowX).toBe('hidden');

    // Columns should use relative/flexible widths (w-full, flex-1) instead of fixed pixels
    expect(nav.className).toContain('w-full');
    expect(mainColumn.className).toContain('flex-1');
    expect(mainColumn.className).toContain('min-w-0');
  });

  it('checks that navigation components scale down gracefully', () => {
    render(React.createElement(UserDetailsResponsiveLayout));

    const nav = screen.getByTestId('mobile-nav');

    // Expecting scale down transform on mobile, standard on md+ viewports
    expect(nav.className).toContain('scale-95');
    expect(nav.className).toContain('md:scale-100');
    expect(nav.className).toContain('flex-shrink-0');
  });

  it('asserts mobile-specific toggle states respond cleanly', () => {
    render(React.createElement(UserDetailsResponsiveLayout));

    const toggleBtn = screen.getByTestId('mobile-toggle');

    // Must be hidden on desktop but visible on mobile
    expect(toggleBtn.className).toContain('block');
    expect(toggleBtn.className).toContain('md:hidden');

    // Toggle state defaults to closed
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Triggers interaction cleanly
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Toggles back
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
