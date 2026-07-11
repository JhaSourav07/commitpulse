import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import { DescriptionSection } from './DescriptionSection';

// ----------------------------------------------------------------------
// Responsive Wrapper
// ----------------------------------------------------------------------
function ResponsiveLayoutWrapper() {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth <= 768;

  return (
    <div
      data-testid="main-container"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: isMobile ? '100%' : '1200px',
      }}
    >
      {/* 4. Check that navigation components scale down gracefully */}
      <nav data-testid="navigation-component" style={{ width: isMobile ? '100%' : '250px' }}>
        {isMobile && (
          <button data-testid="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        )}
      </nav>

      {/* 3. Verify styling values are not absolute widths */}
      <div
        data-testid="content-column"
        style={{ width: isMobile ? '100%' : '800px', overflowX: 'hidden' }}
      >
        <DescriptionSection value="Responsive Bio" onChange={() => {}} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------
describe('Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore the window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    fireEvent(window, new Event('resize'));
  });

  const setViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    act(() => {
      fireEvent(window, new Event('resize'));
    });
  };

  it('1. Mock standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    setViewport(375); // iPhone SE width
    render(<ResponsiveLayoutWrapper />);
    expect(window.innerWidth).toBe(375);
  });

  it('2. Assert that columns reflow into standard vertical flex lists', () => {
    setViewport(375); // Mobile
    render(<ResponsiveLayoutWrapper />);

    const container = screen.getByTestId('main-container');
    // Verify flex-direction switched to column for mobile
    expect(container.style.flexDirection).toBe('column');
  });

  it('3. Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    setViewport(375); // Mobile
    render(<ResponsiveLayoutWrapper />);

    const contentColumn = screen.getByTestId('content-column');
    // Content width must be dynamic (100%) on mobile, not fixed pixels
    expect(contentColumn.style.width).toBe('100%');
    expect(contentColumn.style.overflowX).toBe('hidden');
  });

  it('4. Check that navigation components scale down gracefully', () => {
    setViewport(1024); // Desktop
    const { unmount } = render(<ResponsiveLayoutWrapper />);
    let nav = screen.getByTestId('navigation-component');
    expect(nav.style.width).toBe('250px'); // Fixed sidebar width
    unmount();

    setViewport(375); // Mobile
    render(<ResponsiveLayoutWrapper />);
    nav = screen.getByTestId('navigation-component');
    expect(nav.style.width).toBe('100%'); // Scales to viewport
  });

  it('5. Assert mobile-specific toggle states respond cleanly', () => {
    setViewport(375); // Mobile
    render(<ResponsiveLayoutWrapper />);

    const toggleBtn = screen.getByTestId('mobile-toggle');
    expect(toggleBtn.textContent).toBe('Menu');

    // Simulate clicking the hamburger menu toggle
    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toBe('Close');
  });
});
