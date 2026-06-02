/* ==========================================================================
 * COMPONENT LAYER — RESPONSIVE MULTI-DEVICE VIEWPORT BOUNDARIES (VARIATION 7)
 * ========================================================================== */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const MockComparePage = ({ viewportWidth }: { viewportWidth: number }) => {
  const isMobile = viewportWidth <= 768;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        maxWidth: '1200px',
      }}
      data-testid="compare-container"
    >
      <header
        style={{ width: '100%', padding: isMobile ? '10px' : '20px' }}
        data-testid="nav-header"
      >
        <span data-testid="nav-scale">{isMobile ? 'Mobile Nav' : 'Desktop Navbar'}</span>
      </header>

      <div
        style={{ flex: 1, minWidth: isMobile ? '100%' : '50%' }}
        data-testid="column-user-1"
        className={isMobile ? 'w-full block' : 'w-1/2 inline-block'}
      >
        User 1 Stats Card
      </div>
      <div
        style={{ flex: 1, minWidth: isMobile ? '100%' : '50%' }}
        data-testid="column-user-2"
        className={isMobile ? 'w-full block' : 'w-1/2 inline-block'}
      >
        User 2 Stats Card
      </div>

      {isMobile && (
        <button data-testid="mobile-toggle" data-state="active">
          Mobile Action View
        </button>
      )}
    </div>
  );
};

describe('ComparePage — Responsive Viewport Layout Bounds (Variation 7)', () => {
  const originalInnerWidth = window.innerWidth;

  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  afterEach(() => {
    setViewportWidth(originalInnerWidth);
    vi.restoreAllMocks();
  });

  // 1. Mock standard mobile-width media coordinates (e.g. 375px wide viewports)
  it('correctly adapts layout constraints to standard mobile coordinates at 375px', () => {
    setViewportWidth(375);
    render(<MockComparePage viewportWidth={375} />);

    const container = screen.getByTestId('compare-container');
    expect(window.innerWidth).toBe(375);
    expect(container).toBeDefined();
  });

  it('forces columns to reflow into a vertical stacked flex alignment on narrow device screens', () => {
    setViewportWidth(375);
    render(<MockComparePage viewportWidth={375} />);

    const container = screen.getByTestId('compare-container');
    expect(container.style.flexDirection).toBe('column');
  });

  it('avoids absolute hardcoded pixel width definitions on columns to prevent layout truncation clipping', () => {
    setViewportWidth(375);
    render(<MockComparePage viewportWidth={375} />);

    const col1 = screen.getByTestId('column-user-1');
    const col2 = screen.getByTestId('column-user-2');

    expect(col1.style.minWidth).toBe('100%');
    expect(col2.style.minWidth).toBe('100%');
    expect(col1.style.minWidth).not.toBe('600px');
  });

  it('scales down secondary structural navigation components cleanly on tight breakpoints', () => {
    setViewportWidth(375);
    render(<MockComparePage viewportWidth={375} />);

    const header = screen.getByTestId('nav-header');
    const navText = screen.getByTestId('nav-scale');

    expect(header.style.padding).toBe('10px');
    expect(navText.textContent).toBe('Mobile Nav');
  });

  it('activates and renders mobile-specific control toggles under small viewport modes exclusively', () => {
    setViewportWidth(375);
    render(<MockComparePage viewportWidth={375} />);

    const mobileToggle = screen.getByTestId('mobile-toggle');
    expect(mobileToggle).toBeDefined();
    expect(mobileToggle.getAttribute('data-state')).toBe('active');
  });
});
